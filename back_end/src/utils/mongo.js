const mongoose = require('mongoose');
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

const BookSchema = new mongoose.Schema({
  _id: Number,
  title: String,
  author: String,
  group: String,
  price: Number
});

BookSchema.plugin(mongoose_fuzzy_searching, {
  fields: [
    {
      name: 'title',
      weight: 5
    },
    {
      name: 'author',
      weight: 1
    }
  ]
});


const Book = mongoose.model('Books', BookSchema);

const updateFuzzy = async (Model, attrs) => {
  for await (const doc of Model.find()) {
    if (attrs && attrs.length) {
      const obj = attrs.reduce((acc, attr) => ({ ...acc, [attr]: doc[attr] }), {});
      await Model.findByIdAndUpdate(doc._id, obj);
    }
  }
};

const setupMongo = async () => {
  return new Promise(async (res) => {
    mongoose.Promise = global.Promise;
    mongoose.connect('mongodb://localhost:27017/elib_NLP', async () => {
      console.log('connected to mongo', mongoose.connections[0].models);
      await updateFuzzy(Book, ['author', 'title']);
      res();
    });
  });
};

module.exports = { Book, setupMongo };

