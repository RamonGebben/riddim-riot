import { Container, Graphics } from 'pixi.js';
import { PLAYER_RADIUS, type Player } from '../../sim/player';
import type { Palette } from '../../palette';

export interface PlayerView {
  view: Container;
  update: (state: { player: Player; beat: number; shot: number }) => void;
}

const SQUASH = 0.18;
const RECOIL = 5;

export const createPlayerView = (palette: Palette): PlayerView => {
  const halo = new Graphics()
    .circle(0, 0, PLAYER_RADIUS * 1.9)
    .fill({ color: palette.player, alpha: 0.18 });
  const body = new Graphics().circle(0, 0, PLAYER_RADIUS).fill(palette.player);
  const barrel = new Graphics()
    .roundRect(PLAYER_RADIUS * 0.4, -5, PLAYER_RADIUS * 1.3, 10, 4)
    .fill(palette.accent);
  const muzzle = new Graphics()
    .circle(PLAYER_RADIUS * 1.9, 0, 9)
    .fill(0xffffff);
  const gun = new Container();
  gun.addChild(barrel, muzzle);

  const view = new Container();
  view.addChild(halo, body, gun);

  return {
    view,
    update: ({ player, beat, shot }) => {
      view.position.set(player.position.x, player.position.y);
      // Squash on every beat, driven by the same clock as the drums.
      body.scale.set(1 + beat * SQUASH, 1 - beat * SQUASH);
      halo.scale.set(1 + beat * 0.35);
      halo.alpha = 0.6 + beat * 0.4;
      gun.rotation = player.aim;
      barrel.x = -shot * RECOIL;
      muzzle.alpha = shot;
      muzzle.scale.set(0.5 + shot);
    },
  };
};
