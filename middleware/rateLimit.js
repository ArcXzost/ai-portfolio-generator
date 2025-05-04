export const rateLimit = (windowMs = 60 * 1000, max = 15) => {
  const requests = new Map();
  
  return (req) => {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, lastReset: now });
    } else {
      const record = requests.get(ip);
      if (now - record.lastReset > windowMs) {
        record.count = 1;
        record.lastReset = now;
      } else {
        record.count++;
      }
      
      if (record.count > max) {
        throw new Error('Rate limit exceeded');
      }
    }
  };
}; 