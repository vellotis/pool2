'use strict';

var inherits = require('util').inherits,
    EventEmitter = require('events').EventEmitter,
    debug = require('debug')('pool2');

var _id = 0;

// this has promisey semantics but can't really be replaced with a simple promise
function ResourceRequest(timeout, callback) {
    if (typeof timeout === 'function') {
        callback = timeout;
        timeout = 0;
    }
    EventEmitter.call(this);
    
    this.id = _id++;
    this.ts = new Date();
    this.cb = callback;
    this.fulfilled = false;
    this._timer = null;
    // if timeout is 0 then given resource request never times out
    if (timeout !== 0) { this._timeout(timeout); }
}
inherits(ResourceRequest, EventEmitter);

ResourceRequest.prototype.resolve = function (res) {
    if (this.fulfilled) {
        this.emit('error', new Error('ResourceRequest.resolve(): Already fulfilled'));
    } else {
        this._fulfill();
        this.emit('resolve', res, this.cb);
    }
};
ResourceRequest.prototype.reject = function (err) {
    if (this.fulfilled) {
        this.emit('error', err);
    } else {
        this._fulfill();
        this.emit('reject', err, this.cb);
    }
};
ResourceRequest.prototype.abort = function () {
    this._fulfill();
};
ResourceRequest.prototype._fulfill = function() {
    this._clearTimeout();
    this.fulfilled = true;
};
ResourceRequest.prototype._timeout = function (timeout) {
    this._timer = setTimeout(function () {
        debug('Resource request timeout, rejecting (id=%d)', this.id);
        this._clearTimeout();
        var err = new Error('Resource request timed out');
        this.emit('error', err);
        this.reject(err);
    }.bind(this), timeout);
};
ResourceRequest.prototype._clearTimeout = function (timeout) {
    if (this._timer !== null) {
        clearTimeout(this._timer);
        this._timer = null;
    }
};

module.exports = ResourceRequest;
