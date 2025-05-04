export const errorLogger = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function (body) {
    if (res.statusCode >= 400) {
      console.error('API Error:', {
        status: res.statusCode,
        path: req.url,
        method: req.method,
        error: typeof body === 'string' ? body : body?.error
      });
    }
    return originalSend.call(this, body);
  };
  
  next();
}; 