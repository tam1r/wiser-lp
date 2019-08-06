const capitalize = (str) => {
  if (str.length > 0 && str.constructor.name === 'String') {
    return `${str[0].toUpperCase()}${str.substring(1, str.length)}`
  }

  return str;
}

export { capitalize };
