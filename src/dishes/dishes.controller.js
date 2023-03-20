const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res, next) {
  // console.log("dishes list function");
  res.json({ data: dishes });
  // const { dishId } = req.params;
  // res.json({
  //   data: dishes.filter(dishId ? (dish) => dish.id === dishId : () => true),
  // });
}

function dishExists(req, res, next) {
  // console.log("dish exists check");
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

function idsMatch(req, res, next) {
  const { dishId } = req.params;
  const {
    data: { id },
  } = req.body;
  if (id) {
    if (dishId !== id) {
      next({
        status: 400,
        message: `id ${id} does not match param :dishId ${dishId}`,
      });
    }
  }
  next();
}

function bodyDataHas(propertyName) {
  // console.log("dishes checking", propertyName);
  return function (req, res, next) {
    const { data = {} } = req.body;
    const bodyValue = data[propertyName];
    if (bodyValue) {
      if (
        propertyName === "price" &&
        (!Number.isInteger(bodyValue) || bodyValue < 0)
      ) {
        return next({
          status: 400,
          message: `Price input must be integer > 0. Input was ${propertyName}: ${bodyValue}`,
        });
      }
      return next();
    }
    next({ status: 400, message: `Must include a valid ${propertyName}` });
  };
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  // const { dishId } = req.params;
  const { data: { name, description, price, image_url } = {} } = req.body;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.json({ data: dish });
}

module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    idsMatch,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    update,
  ],
};
