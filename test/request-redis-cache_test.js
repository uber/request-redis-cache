// Load in our dependencies
var expect = require('chai').expect;
var redisUtils = require('./utils/redis');
var RequestRedisCache = require('../');

// Start tests
describe('A RequestRedisCache', function () {
  redisUtils.run();
  before(function createCache () {
    this.cache = new RequestRedisCache({
      redis: this.redis,
      logger: {}
    });
  });
  after(function cleanupCache () {
    delete this.cache;
  });

  describe('fetching fresh data', function () {
    before(function setupCallCount () {
      this.callCount = 0;
    });
    function getFreshData() {
      before(function (done) {
        var that = this;
        this.cache.get({
          cacheKey: 'fresh-data',
          cacheTtl: 1000,
          uncachedGet: function (options, cb) {
            // DEV: This symbolizes any kind of response (e.g. api client response, HTTP response)
            that.callCount += 1;
            cb(null, {hello: 'world'});
          },
          requestOptions: {}
        }, function (err, data) {
          that.data = data;
          done(err);
        });
      });
    }
    getFreshData();

    it('retrieves our data', function () {
      expect(this.data).to.deep.equal({hello: 'world'});
    });

    describe('when fetched again', function () {
      getFreshData();

      it('does not double request', function () {
        expect(this.callCount).to.equal(1);
      });

      it('retrieves our data', function () {
        expect(this.data).to.deep.equal({hello: 'world'});
      });
    });
  });

  describe('with expired data', function () {
    before(function setupCallCount () {
      this.callCount = 0;
    });
    function getExpiredData() {
      before(function (done) {
        var that = this;
        this.cache.get({
          cacheKey: 'expired-data',
          cacheTtl: 1, // seconds
          uncachedGet: function (options, cb) {
            that.callCount += 1;
            cb(null, {count: that.callCount});
          },
          requestOptions: {}
        }, function (err, data) {
          that.data = data;
          done(err);
        });
      });
    }
    getExpiredData();
    before(function waitForExpiration (done) {
      setTimeout(done, 1100);
    });

    describe('when requested', function () {
      getExpiredData();

      it('grabs the fresh data', function () {
        expect(this.data).to.deep.equal({count: 2});
      });
    });
  });
});

// Edge cases for verifying we handle errors nicely
describe.skip('A RequestRedisCache retrieving from a downed redis instance', function () {
  it('emits a descriptive error', function () {

  });

  it('grabs fresh data', function () {

  });
});

describe.skip('A RequestRedisCache with malformed data', function () {
  it('emits a descriptive error', function () {

  });

  it('invalidates the cached data', function () {

  });

  it('grabs fresh data', function () {

  });
});

// DEV: This verifies `redis.get` and `redis.setex` degrades nicely
// TODO: We cannot think of a test case for verifying error handling with `del`
describe.skip('A RequestRedisCache caching fresh data with a bad key', function () {
  it('emits an error about the get from cache', function () {

  });

  it('emits an error about the set to cache', function () {

  });

  it('returns fresh data', function () {

  });
});
