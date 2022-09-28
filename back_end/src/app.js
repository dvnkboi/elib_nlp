const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const fsConstants = require('fs').constants;
const path = require('path');
const uuid = require('uuid');
// const promiseUtils = require('./utils/promises');
const Socket = require('./utils/socket');
const { Book, setupMongo } = require('./utils/mongo');

const libPath = path.join(__dirname, './lib/python/main.py');

process.env.PYTHONIOENCODING = 'utf-8';
const { PythonShell } = require("python-shell");

const app = express();

app.use(cors());

const processDefaults = {
  'cont_smooth': [3, 1],
  'gaus_filt': [7, 7],
  'tess_config': '',
  'tess_confid': 60,
  'tess_pattern': '^\w+$',
  'rect_pad': [3, 3],
};

const imageTimeouts = {};

function checkFileExists(file) {
  return fs.access(file, fsConstants.F_OK)
    .then(() => true)
    .catch(() => false);
}

const searchWithConfidence = async (text) => {
  const res = await Book.fuzzySearch({
    query: text,
    minSize: 3
  });
  return {
    res: res[0],
    confidence: res[0]?._doc.confidenceScore ?? 0
  };
};

app.use(express.json({
  limit: "3mb",
}));

const socketServer = new Socket(app);

const nlp = new PythonShell(libPath, {
  pythonOptions: ['-u'],
});


// when python returns a result 
nlp.on("message", async (message) => {
  console.log(message);

  try {
    message = JSON.parse(message.toString());
  }
  catch (e) {
    console.error(e);
    return;
  }

  const id = message.id;
  const imagePath = getImagePath(id);

  // when python return type is zoneText use this info to search in database
  if (message.type == 'zoneText') {
    let prevConf = 0;
    let result = null;

    if (message.nlpResult && message.nlpResult != '' && message.nlpResult.length > 0) {
      for (const text of message.nlpResult) {
        const { res, confidence } = await searchWithConfidence(text);
        if (prevConf <= confidence) {
          result = {
            article: res,
            query: text
          };
        }
        prevConf = confidence;
      }
    }

    const { res, confidence } = await searchWithConfidence(message.text);
    if (prevConf <= confidence) {
      result = {
        article: res,
        query: message.text
      };
    }
    message.dbRes = result;
  }

  socketServer.io.to(id).emit(message.type, message);

  if (message.type == 'done') {
    if (imageTimeouts[id]) clearTimeout(imageTimeouts[id]);
    imageTimeouts[id] = null;
    imageTimeouts[id] = setTimeout(() => {
      console.log('deleting image for', id);
      fs.rm(imagePath, {
        force: true,
        maxRetries: 3,
        retryDelay: 500
      });
      socketServer.io.to(id).emit('imageDeleted');
    }, 30000);

    socketServer.io.to(id).emit('done');
  }
  else if (message.type == 'nlpReady') {
    console.log('ready to take commands');
  }
});

nlp.on('stderr', (err) => console.log(err));
nlp.on('close', () => {
  console.log('ended nlp script');
});

const end = () => {
  nlp.end(function (err, code, signal) {
    if (err) throw err;
    console.log("finished");
  });
};

socketServer.io.on('connection', async (socket) => {
  const id = socket.id;
  const imagePath = getImagePath(id);
  console.log('new user', id);

  socket.on('process', async (data) => {
    await writeImage(imagePath, data.image);
    sendCommand('process', id, {
      options: {
        ...processDefaults,
        ...data.options
      }
    });
  });

  socket.on('get_zones', async (data) => {
    await writeImage(imagePath, data.image);
    sendCommand('get_zones', id, {
      options: {
        ...processDefaults,
        ...data.options
      }
    });
  });

  socket.on("disconnect", () => {
    sendCommand('stop', id);
  });

  socket.on("handshake", async () => {
    const exists = await checkFileExists(imagePath);
    socket.emit('handshake', {
      exists
    });
    console.log('handshake ok', id);
  });
});

const getImagePath = (id) => {
  return path.join(__dirname, `./images/${id}.png`);
};

const sendCommand = (command, id, payload = {}) => {
  nlp.send(JSON.stringify({
    command: 'stop',
    id
  }));
  nlp.send(JSON.stringify({
    command,
    id,
    ...payload
  }));
  console.log(command, id);
};

const writeImage = async (path, base64Image) => {
  const fileExists = await checkFileExists(path);
  if (!fileExists) {
    const base64Data = base64Image.replace(/^data:image\/png;base64,/, "").replace(/^data:image\/jpeg;base64,/, "");
    await fs.writeFile(path, base64Data, 'base64', function (err) {
      if (err) console.log(err);
      res.json({ 'err': err });
    });
  }
  else {
    console.log('read from existing', path);
  }
};



module.exports = {
  app,
  socketServer
};