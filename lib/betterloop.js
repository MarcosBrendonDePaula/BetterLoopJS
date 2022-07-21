var window = window || {_web_render: false}
var module = module
window._window_checked_ = false;

//checks if there is a graphics engine, if there is, the execution becomes a web interface
(()=>{
    if (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ){
        window._web_render = true;
        module = {}
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame 
    }else{
        window.requestAnimationFrame = ()=>{};
        
    }
    window._window_checked_ = true;
})()

class Nano {
    static s2nano = 1e9;
    static nano2s = 1 / Nano.s2nano;
    static ms2nano = 1e6;
    
    static get(){
        var hrtime = process.hrtime();
        return (+hrtime[0]) * Nano.s2nano + (+hrtime[1]);
    }
}

class Loop{
    
    static _staticloopId = 0;
    
    constructor(callback = ()=>{},loopIntervalMs = 1000){
        Loop._staticloopId += 1;
        this.uid = Loop._staticloopId;

        this._callback = callback;
        this._loopInterval_ms = loopIntervalMs;
        this._lastTick = -1,
        this._proxTick = -1;
        this._main_loop = ()=>{}
        this._running = false;
    }
    
    async start(){
        if(!window._web_render){
            this.tickLengthMs = this._loopInterval_ms
            this.tickLengthNano = this.tickLengthMs * Nano.ms2nano;
            this.sellongwaitMs = Math.floor(this.tickLengthMs - 1);
	        this.longwaitNano = this.longwaitMs * Nano.ms2nano;
            
            let temp_nano = Nano.get()
            this.act = [temp_nano,temp_nano]
            
            this.main_loop = ()=>{
                const now = Nano.get();

                if (now >= this.act[1]) {
                    const delta = now - this.act[0];
                    this.act[0] = now;
                    this.act[1] = now + this.tickLengthNano;
                    this._callback(delta * Nano.nano2s);
                }
                
                const remainingInTick = this.act[1] - Nano.get();
                if (remainingInTick > this.longwaitNano) {
                    setTimeout(this.main_loop, Math.max(this.longwaitMs, 1));
                } else {
                    setImmediate(this.main_loop);
                }
            }
            this.main_loop()
        }
        else
        {
            this._request_animation_frame_id = -1;
            this.main_loop = (timestamp) => {
                this._request_animation_frame_id = window.requestAnimationFrame(this.main_loop)
                if(timestamp >= this._proxTick)
                {
                    this._callback(timestamp);
                    this._proxTick = (timestamp + this._loopInterval_ms) - (timestamp - this._proxTick)
                    this._lastTick = timestamp
                }
            }
            this._request_animation_frame_id = window.requestAnimationFrame(this.main_loop)
        }
    }

    stop(){
        this._main_loop = ()=>{
            this._running = false;
        }
    }

}

class BetterLoops {
    
    static getUps(updatesPerSecond = 60){
        return  1000 / updatesPerSecond;
    }

    constructor() {
        this._loops_ = {};
    }

    makeLoop(callback = ()=>{}, UPS = getUps(60), customId = undefined){
        let loop = new Loop(callback, UPS)
        if(customId) {
            this._loops_[customId] = loop;
        }else{
            this._loops_[loop.uid] = loop;
        }
        return loop;
    }
    
    getLoop(id=undefined){
        return this._loops_custom_[id];
    }
}

module.exports = {
    BetterLoops:BetterLoops,
    Loop:Loop,
    Nano:Nano
}