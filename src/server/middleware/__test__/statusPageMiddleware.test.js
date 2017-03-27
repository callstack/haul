const statusPageMiddleware = require('../statusPageMiddleware');

describe('status page middleware', () => {
  it('should respond with status:running', () => {
    const url = '/status';
    const end = jest.fn();
    const next = jest.fn();
    statusPageMiddleware({ url }, { end }, next);
    expect(end).toHaveBeenCalledWith('packager-status:running');
    expect(next).not.toHaveBeenCalled();
  });
  it('should skip to next', () => {
    const url = '/';
    const end = jest.fn();
    const next = jest.fn();
    statusPageMiddleware({ url }, { end }, next);
    expect(end).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
