const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res, next) {
  res.json({ data: orders });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

// TODO: Implement the /orders handlers needed to make the tests pass
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    const bodyValue = data[propertyName];
    if (bodyValue) {
      if (propertyName === "dishes") {
        if (!Array.isArray(bodyValue) || bodyValue.length === 0) {
          return next({
            status: 400,
            message: `Dishes input must nonzero. Input ${propertyName}: ${bodyValue}`,
          });
        }
        let dishIndex = 0;
        let eachDishHasQty = true;
        bodyValue.forEach((dish, index) => {
          if (!dish.quantity || !Number.isInteger(dish.quantity)) {
            eachDishHasQty = false;
            dishIndex = index;
          }
        });
        if (!eachDishHasQty) {
          return next({
            status: 400,
            message: `Dish ${dishIndex} must have a quantity that is an integer greater than 0`,
          });
        }
      }
      return next();
    }
    next({ status: 400, message: `Must include a valid ${propertyName}` });
  };
}

function idsMatch(req, res, next) {
  const { orderId } = req.params;
  const {
    data: { id },
  } = req.body;
  if (id) {
    if (orderId === id) {
      return next();
    }
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  next();
}

function statusIsValid(req, res, next) {
  const validStatuses = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];
  const orderStatus = res.locals.order.status;
  const { data: { status } = {} } = req.body;
  if (validStatuses.includes(status)) {
    if (orderStatus !== "delivered") {
      return next();
    } else {
      next({
        status: 400,
        message: "A delivered order cannot be changed",
      });
    }
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}

function statusIsPending(req, res, next) {
  const order = res.locals.order;
  if (order.status === "pending") {
    return next();
  }
  next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
    status: "pending",
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;
  res.json({ data: order });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const orderIndex = orders.findIndex((order) => order.id === orderId);
  orders.splice(orderIndex, 1);
  res.status(204).send();
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    create,
  ],
  update: [
    orderExists,
    idsMatch,
    statusIsValid,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    update,
  ],
  delete: [orderExists, statusIsPending, destroy],
};
