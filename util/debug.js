const exp = {};

const WHITE = "\x1b[37m";

const method_colors = {
  "GET": "\x1b[32m",
  "POST": "\x1b[33m",
  "PUT": "\x1b[34m",
  "PATCH": "\x1b[40m",
  "DELETE": "\x1b[31m"
};

const get_method_color = method => {
  return method_colors[method] ? method_colors[method] : "";
};

exp.log_request = (req, _res, next) => {
  const { method, path } = req;

  const ts_str = `[${new Date().toLocaleString()}] `;
  const ip_str = `${req.ip} `;
  const method_str = get_method_color(method) + method + WHITE + " ";
  const path_str = path + " ";

  console.log(ts_str + ip_str + method_str + path_str);

  next();
};

exp.show_redirects = (req, res, next) => {
  const rd = res.redirect.bind(res);

  res.redirect = uri => {
    console.log(`REDIRECT ${req.baseUrl} => ${uri}`);

    return rd(uri);
  };

  next();
}

exp.show_session = (req, _res, next) => {
  console.log(JSON.stringify(req.session, false, 2));

  next();
};

module.exports = exp;