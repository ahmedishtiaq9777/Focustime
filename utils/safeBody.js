function safeBody(body) {
  if (!body) return body;

  const copy = { ...body };
  if (copy.password) copy.password = "***"; //
  if (copy.token) copy.token = "***"; //

  return copy;
}

module.exports = safeBody;
