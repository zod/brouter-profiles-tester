import validate from "aproba";

// Based on https://github.com/iarna/run-queue
class RunQueue {
  constructor(opts) {
    validate("Z|O", [opts]);
    if (!opts) opts = {};
    this.finished = false;
    this.inflight = 0;
    this.maxConcurrency = opts.maxConcurrency || 1;
    this.queued = 0;
    this.queue = [];
    this.results = [];
    this.deferred = {};
  }

  run() {
    if (arguments.length !== 0)
      throw new Error("RunQueue.run takes no arguments");
    var self = this;
    var deferred = this.deferred;
    if (!deferred.promise) {
      deferred.promise = new Promise(function (resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
        self._runQueue();
      });
    }
    return deferred.promise;
  }

  _runQueue() {
    var self = this;

    while (this.inflight < this.maxConcurrency && this.queued) {
      --this.queued;
      ++this.inflight;
      var next = this.queue.shift();
      var args = next.args || [];

      // we explicitly construct a promise here so that queue items can throw
      // or immediately return to resolve
      var queueEntry = new Promise((resolve) => {
        resolve(next.cmd.apply(null, args));
      });

      queueEntry
        .then((result) => {
          this.results.push(result);
          --self.inflight;
          if (self.finished) return;
          if (self.queued <= 0 && self.inflight <= 0) {
            self.finished = true;
            self.deferred.resolve(this.results);
          }
          self._runQueue();
        })
        .catch((err) => {
          self.finished = true;
          self.deferred.reject(err);
        });
    }
  }

  add(cmd, args) {
    if (this.finished)
      throw new Error("Can't add to a finished queue. Create a new queue.");
    validate("FA|FZ", [cmd, args]);
    ++this.queued;
    this.queue.push({ cmd: cmd, args: args });
  }
}

export default RunQueue;
