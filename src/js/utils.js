export function applyToArrayOrValue(maybeArray, cb, args) {
	if (Array.isArray(maybeArray))
		for (let m of maybeArray)
			cb(m,args);
	else
		cb(maybeArray,args);
}