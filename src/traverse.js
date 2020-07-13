function isArray(o) {
  return Object.prototype.toString.call(o) === '[object Array]';
}

function traverse(obj, fn) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key];

      if (isArray(value)) {
        value.forEach(element => {
          if (typeof element === 'object' && element !== null)
            traverse(element, fn);
        });
      } else if (typeof value === 'object' && value !== null) {
        traverse(value, fn);
      } else {
        fn(key, value);
      }
    }
  }
}

module.exports = { traverse };
