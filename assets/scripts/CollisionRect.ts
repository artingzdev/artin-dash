import { GameObject } from "./GameObject";
import { GameLayer } from "./LayerManager";

export class CollisionRect {
  type: number;
  x: number;
  y: number;
  w: number;
  h: number;
  activated: boolean;
  rotation: number;
  layer: GameLayer;
  object: GameObject;

  constructor(type: number, x: number, y: number, width: number, height: number, rotation: number = 0, layer: GameLayer, object: GameObject) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.w = width;
    this.h = height;
    this.activated = false;
    this.rotation = rotation;
    this.layer = layer;
    this.object = object;
  }
}