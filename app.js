const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1/todolist");

const itemsSchema = {
  name: String,
  context: String,
  date: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
  context: "info",
  date: "2023-04-27",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
  context: "info",
  date: "2023-04-27",
});

const item3 = new Item({
  name: "Hit the delete button to delete.",
  context: "info",
  date: "2023-04-27",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({})
    .then(function (foundItems) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully saved default items to DB.");
          })
          .catch(function (error) {
            console.log("Error inserting documents", error);
          });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Todo List",
          newListItems: foundItems,
        });
      }
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .exec()
    .then((foundList) => {
      if (!foundList) {
        //Create a new List
        //console.log("Doesn't exist!");
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        //console.log("Exists!");
        if (foundList.items === null || foundList.items === undefined) {
          foundList.items = defaultItems;
        }
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const itemDate = req.body.newDate;
  const itemContext = req.body.tasks;
  const listName = req.body.list; // value in the form is returned

  const item = new Item({
    name: itemName,
    context: itemContext,
    date: itemDate,
  });

  if (listName === "Todo List") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .exec()
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

//STOP

app.post("/delete", function (req, res) {
  const id = req.body.id;
  const listName = req.body.listName;
  console.log(id);
  console.log(listName);
  if (listName === "Todo List") {
    Item.findByIdAndRemove(id)
      .exec()
      .then((user) => {
        console.log("User removed :", user);
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: id } } })
      .then((foundList) => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.listen(8000, function () {
  console.log("Server started on port 8000");
});
