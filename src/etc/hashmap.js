// linking the key-value-pairs is optional
// if no argument is provided, linkItems === undefined, i.e. !== false
// --> linking will be enabled
function HashMap(linkItems) {
    this.current = undefined;
    this.size = 0;

    if(linkItems === false)
        this.disableLinking();
}

HashMap.noop = function() {
    return this;
};

HashMap.illegal = function() {
    throw new Error("illegal operation for maps without linking");
};

// map initialisation from existing object
// doesn't add inherited properties if not explicitly instructed to:
// omitting foreignKeys means foreignKeys === undefined, i.e. == false
// --> inherited properties won't be added
HashMap.from = function(obj, foreignKeys) {
    var map = new HashMap;

    for(var prop in obj) {
        if(foreignKeys || obj.hasOwnProperty(prop))
            map.put(prop, obj[prop]);
    }

    return map;
};

HashMap.prototype.disableLinking = function() {
    this.link = HashMap.noop;
    this.unlink = HashMap.noop;
    this.disableLinking = HashMap.noop;
    this.next = HashMap.illegal;
    this.key = HashMap.illegal;
    this.value = HashMap.illegal;
    this.removeAll = HashMap.illegal;

    return this;
};

// overwrite in Map instance if necessary
HashMap.prototype.hash = function(value) {
    console.log(Object.keys(arguments))
    return (typeof value) + ' ' + (value instanceof Object ?
        (value.__hash || (value.__hash = ++arguments.callee.current)) :
        value.toString());
};

HashMap.prototype.hash.current = 0;

// --- mapping functions

HashMap.prototype.get = function(key) {
    const h = this.hash(key)
    var item = this[h];
    return item === undefined ? undefined : item.value;
};

HashMap.prototype.put = function(key, value) {
    var hash = this.hash(key);

    if(this[hash] === undefined) {
        var item = { key : key, value : value };
        this[hash] = item;

        this.link(item);
        ++this.size;
    }
    else this[hash].value = value;

    return this;
};

HashMap.prototype.remove = function(key) {
    var hash = this.hash(key);
    var item = this[hash];

    if(item !== undefined) {
        --this.size;
        this.unlink(item);

        delete this[hash];
    }

    return this;
};

// only works if linked
HashMap.prototype.removeAll = function() {
    while(this.size)
        this.remove(this.key());

    return this;
};

// --- linked list helper functions

HashMap.prototype.link = function(item) {
    if(this.size == 0) {
        item.prev = item;
        item.next = item;
        this.current = item;
    }
    else {
        item.prev = this.current.prev;
        item.prev.next = item;
        item.next = this.current;
        this.current.prev = item;
    }
};

HashMap.prototype.unlink = function(item) {
    if(this.size == 0)
        this.current = undefined;
    else {
        item.prev.next = item.next;
        item.next.prev = item.prev;
        if(item === this.current)
            this.current = item.next;
    }
};

// --- iterator functions - only work if map is linked

HashMap.prototype.next = function() {
    this.current = this.current.next;
};

HashMap.prototype.key = function() {
    return this.current.key;
};

HashMap.prototype.value = function() {
    return this.current.value;
};

module.exports = HashMap