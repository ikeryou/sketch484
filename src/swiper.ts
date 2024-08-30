import { Conf } from '../core/conf';
import { Func } from '../core/func';
import { MouseMgr } from '../core/mouseMgr';
import { MyDisplay } from '../core/myDisplay';
import { Tween } from '../core/tween';
import { DisplayConstructor } from '../libs/display';
import { Point } from '../libs/point';
import { Util } from '../libs/util';

export class Swiper extends MyDisplay {
  private _tg: HTMLElement;
  private _isTouch: boolean = false;
  private _pA: Point = new Point();
  private _pB: Point = new Point();
  private _move: number = 0;
  private _startPos: Point = new Point();
  private _nowPos: Point = new Point();
  private _follow: Point = new Point();
  private _min: Point = new Point();
  private _max: Point = new Point();
  private _items: Array<SwiperItem> = [];

  constructor(opt: DisplayConstructor) {
    super(opt);

    this._tg = this.qs('.js-swiper-tg');
    this.useGPU(this._tg)

    MouseMgr.instance.usePreventDefault = true;

    // アイテム複製
    const org = document.querySelector('.js-copy') as HTMLElement;
    for(let i = 0; i < Conf.ITEM_NUM; i++) {
      const el = org.cloneNode(true) as HTMLElement;
      el.classList.remove('js-copy');
      this._tg.appendChild(el);
    }

    this.qsAll('.js-swiper-item').forEach((el,i) => {
      this._items.push(
        new SwiperItem({
          el: el,
          dispId: i,
        }),
      );
    });

    if (Conf.IS_TOUCH_DEVICE) {
      this._tg.addEventListener('touchstart', () => {
        this._eTouchStart();
      });
      MouseMgr.instance.onTouchEnd.push(() => {
        this._eTouchEnd();
      });
    } else {
      this._tg.addEventListener('mousedown', () => {
        this._eTouchStart();
      });
      MouseMgr.instance.onMouseUp.push(() => {
        this._eTouchEnd();
      });
    }
  }

  private _eTouchStart(): void {
    this._move = 0;
    this._isTouch = true;

    this._pA.set(MouseMgr.instance.x, MouseMgr.instance.y);

    this._startPos.x = this._nowPos.x;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grab';
  }

  private _eTouchEnd(): void {
    if (!this._isTouch) return;
    this._isTouch = false;

    this._startPos.x = this._nowPos.x;

    // ドラッグ後のフォロー値
    this._follow.x = MouseMgr.instance.d.x * -20;

    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }

  // 更新
  protected _update(): void {
    super._update();

    const marginX = 0
    const itemWidth = Func.sw() * 0.8
    this._min.x = this._items[this._items.length - 1].el.offsetLeft * -1 - itemWidth + Func.sw() - marginX;
    this._max.x = marginX;

    if (this._isTouch) {
      this._pB.set(MouseMgr.instance.x, MouseMgr.instance.y);
      if (Conf.IS_TOUCH_DEVICE) {
        this._pA = MouseMgr.instance.tStartVal[0];
      }
      this._move = (this._pA.x - this._pB.x) * -1;
      let tgX = this._startPos.x + this._move;
      
      if (tgX > this._max.x) tgX = this._max.x + (tgX - this._max.x) * 0.5;
      if (tgX < this._min.x) tgX = this._min.x + (tgX - this._min.x) * 0.5;
      this._nowPos.x = tgX;
    } else {
      this._follow.x += (0 - this._follow.x) * 0.1;
      this._startPos.x += this._follow.x;
      const tgX = this._startPos.x + this._follow.x;

      const be = 0.2;
      if (tgX > this._max.x) {
        this._nowPos.x += (this._max.x - this._nowPos.x) * be;
      } else if (tgX < this._min.x) {
        this._nowPos.x += (this._min.x - this._nowPos.x) * be;
      } else {
        this._nowPos.x = Util.clamp(tgX, this._min.x, this._max.x);
      }
    }

    Tween.set(this._tg, {
      x: this._nowPos.x,
    });
  }
}

export class SwiperItem extends MyDisplay {
  private _id:number

  constructor(opt: DisplayConstructor) {
    super(opt);
    this._id = opt.dispId as number;
    // const nextId = this._id + 1

    const bg = this.qs('.bg');

    const ang = this._id * 20
    // const nextAng = nextId * 10
    
    const size = 25
    const radius = 4
    const num = 18
    for(let i = 0; i < num; i++) {
      const el = document.createElement('div');
      bg.appendChild(el);

      const total = 90
      const rad = Util.radian(ang * 2 + (total / num) * i)
      // const nextRad = Util.radian(nextAng * 1 + (total / num) * i)

      const x = 50 + Math.sin(rad) * size - radius * 1;
      const y = 50 + Math.cos(rad) * size - radius * 1;

      const x2 = 50;
      const y2 = 50;

      // 次の位置との角度
      const dx = x2 - x
      const dy = y2 - y
      const nextRot = Util.degree(Math.atan2(dy, dx)) + 90
      
      Tween.set(el, {
        left: x + '%',
        top: y + '%',
        width: (radius * 2) + '%',
        height: (radius * 2) + '%',
        // scaleX: 0.25,
        // scaleY: 2,
        rotationZ: nextRot * 1,
        // borderRadius: `${Util.map(Math.sin(Util.radian(ang * 2)), 0, 50, -1, 1)}%`,
        // border: `5px solid hsl(${Util.map(i, 0, 180, 0, num - 1)}, 100%, 50%)`,
        backgroundColor: `hsl(${Util.map(this._id, 0, 360 * 1, 0, Conf.ITEM_NUM - 1)}, 100%, 100%)`,
      });
    }
  }

  // 更新
  protected _update(): void {
    super._update();
  }
}
