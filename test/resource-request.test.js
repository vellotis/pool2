'use strict';

require('should');

var ResourceRequest = require('../lib/resource-request');

describe('ResourceRequest', function (done) {
    var resourceRequest, resource, error, _seq = 0;
    function noop() { }
    function createResource() { return { seq: _seq++ }; }

    it('should trigger timeout if timeout > 0', function() {
        var resourceRequest = new ResourceRequest(50, function(err, res) {
            (err).should.be.Error;
            done();
        });
    });

    it('should not trigger timeout if timeout is 0', function() {
        resourceRequest = new ResourceRequest(0, function(err, res) {
            should.fail('should not invoke callback');
        });
        setTimeout(done, 50);
    });

    it('should not trigger timeout if only callback provided for constructor', function() {
        resourceRequest = new ResourceRequest(function(err, res) {
            should.fail('should not invoke callback');
        });
        setTimeout(done, 50);
    });

    it('should emit an event in case of resolve invoked (and only once)', function(done) {
        resource = createResource();
        resourceRequest = new ResourceRequest(0, noop);
        resourceRequest.fulfilled.should.be.false;
        resourceRequest.on('resolve', function (res, cb) {
            (res).should.be.exactly(resource);
            done();
        });
        resourceRequest.resolve(resource);
        resourceRequest.fulfilled.should.be.true;
        (function() {
            resourceRequest.resolve(resource);
        }).should.throw('ResourceRequest.resolve(): Already fulfilled');
    });

    it('should emit an event in case of reject invoked (and only once)', function(done) {
        resourceRequest = new ResourceRequest(0, noop);
        resourceRequest.fulfilled.should.be.false;
        error = new Error();

        resourceRequest.once('reject', function (err, cb) {
            (err).should.be.exactly(error);
            (cb).should.be.Function;
        });
        resourceRequest.reject(error);
        resourceRequest.fulfilled.should.be.true;
        resourceRequest.once('error', function (err, cb) {
            (err).should.be.exactly(error);
            (!cb).should.be.ok;
            done();
        });
        resourceRequest.reject(error);
    });

    it('should pass resource and callback as arguments to event if resolve invoked', function(done) {
        resource = createResource();
        resourceRequest = new ResourceRequest(0, function(err, res) {
            (!err).should.be.ok;
            (res).should.be.exactly(resource);
            done();
        });
        resourceRequest.on('resolve', function (res, cb) {
            (res).should.be.exactly(resource);
            cb(null, res);
        });
        resourceRequest.resolve(resource);
    });

    it('should pass resource and callback as arguments to event if reject invoked', function(done) {
        error = new Error();
        resourceRequest = new ResourceRequest(0, function(err, res) {
            (err).should.be.exactly(error);
            (!res).should.be.ok;
            done();
        });
        resourceRequest.on('reject', function (err, cb) {
            (err).should.be.exactly(error);
            cb(err);
        });
        resourceRequest.reject(error);
    });
});