/*

  DEPRECATED; NOW USING PHASER TWEEN SYSTEM AND BUILT-IN EASING INSTEAD.
  FILE MAY BE DELETED ONCE PUBLISHED

*/




// export function lerp(a, b, t) {
//     return a + (b - a) * t
// }



// export function easeIn(a, b, t, e) {
//     return a + (b - a) * Math.pow(t, e);
// }

// export function easeOut(a, b, t, e) {
//     const c = b - a;
//     return a + c * (1 - Math.pow(1 - t, e));
// }

// export function easeInOut(a, b, t, e) {
//     const c = b - a;
//     t *= 2; // t = 2t

//     if (t < 1) {
//         return a + c * 0.5 * Math.pow(t, e);
//     }

//     t = 2 - t;
//     return a + c * (1 - 0.5 * Math.pow(t, e));
// }





// export function easeInQuad(a, b, t) {
//     const c = b - a;
//     return a + c * t * t;
// }

// export function easeOutQuad(a, b, t) {
//     const c = b - a;
//     t = 1 - t;
//     return a + c * (1 - t * t);
// }

// export function easeInOutQuad(a, b, t) {
//     const c = b - a;
//     t += t;

//     if (t < 1) {
//         return a + c * 0.5 * t * t;
//     }

//     t = 2 - t;
//     return a + c * (1 - 0.5 * t * t);
// }