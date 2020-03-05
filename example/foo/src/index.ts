import { bar } from "hark-example-bar";
let count = 0;
setInterval(() => {
  count++;
  console["log"](`Foo${bar}${count.toString()}`);
}, 1000);
