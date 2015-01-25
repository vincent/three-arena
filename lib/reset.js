
Array.slice = function (index, arr) {
  for (var i = index, len = arr.length - 1; i < len; i++)
    arr[i] = arr[i + 1];

  arr.length = len;
}

THREE.Vector3.prototype.toObject = function() {
    return {
        x: this.x,
        y: this.y,
        z: this.z
    }
};