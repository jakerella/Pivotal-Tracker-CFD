
// object helpers
Object.defineProperty(
    Object.prototype, 
    "isFunction",
    {
        writable : false,
        enumerable : false, 
        configurable : false,
        value : function () {
            return {}.toString.call(this) === "[object Function]";
        }
    }
);
// object key iterator (operates just like Array.forEach)
Object.defineProperty(
    Object.prototype, 
    "each",
    {
        writable : false,
        enumerable : false, 
        configurable : false,
        value : function (f, ignoreFunctions) {
            var obj = this;
            ignoreFunctions = !!ignoreFunctions;
            Object.keys(obj).forEach( function(key) { 
                if (ignoreFunctions && obj[key].isFunction()) { return; }
                f( obj[key], key );
            });
        }
    }
);