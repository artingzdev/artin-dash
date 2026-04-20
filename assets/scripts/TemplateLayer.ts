import { _decorator } from 'cc';
import { ADBaseLayer } from './ADBaseLayer';
import { GameLayer } from './LayerManager';
const { ccclass } = _decorator;

@ccclass('TemplateLayer')
export class TemplateLayer extends ADBaseLayer {

        private _param: number = 1;

        setup(param: number): void {
                this._param = param;
        }

        protected initInternal(): void {
                
        }

        static getLayer(): GameLayer {
                return GameLayer.T1;
        }

        // protected update(dt: number): void {
        //         if (!this._initialized) {
        //             return;
        //         }


        // }
}
