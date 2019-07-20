import * as FunctionCurveViewer from "function-curve-viewer";

export interface Component {
   frequency:                number;                       // frequency in Hz
   amplitude:                number; }                     // amplitude in dB

export interface ViewerState {
   components:               Component[];                  // frequency components
   xMin?:                    number;                       // minimum X value
   xMax?:                    number;                       // maximum X value
   yMin?:                    number;                       // minimum Y value
   yMax?:                    number;                       // maximum Y value
   focusShield?:             boolean; }                    // true to ignore mouse wheel events without focus

interface Style {
   componentLineWidth:       number;                       // width of component lines in pixels
   defaultAmplitudeRange:    number; }                     // default amplitude range (Y-axis) in dB

class WidgetContext {

   public canvas:            HTMLCanvasElement;            // the DOM canvas element
   public fcvWidget:         FunctionCurveViewer.Widget;   // the underlying function curve widget
   public components:        Component[];                  // sorted by frequency
   public componentsPos?:    number;                       // previous position in components array, used only for speed optimization
   public style:             Style;

   constructor (canvas: HTMLCanvasElement) {
      this.canvas = canvas;
      this.fcvWidget = new FunctionCurveViewer.Widget(canvas, false);
      this.components = Array(0); }

   public setConnected (connected: boolean) {
      if (connected) {
         this.getStyle(); }
      this.fcvWidget.setConnected(connected); }

   private getStyle() {
      const cs = getComputedStyle(this.canvas);
      const style = <Style>{};
      style.componentLineWidth    = parseInt(  cs.getPropertyValue("--component-line-width")) || 3;
      style.defaultAmplitudeRange = parseFloat(cs.getPropertyValue("--default-amplitude-range")) || 80;
      this.style = style; }

   public getViewerState() : ViewerState {
      const vs2 = this.fcvWidget.getViewerState();
      const vs = <ViewerState>{};
      vs.components = this.components.slice();
      vs.xMin = vs2.xMin;
      vs.xMax = vs2.xMax;
      vs.yMin = vs2.yMin;
      vs.yMax = vs2.yMax;
      vs.focusShield = vs2.focusShield;
      return vs; }

   public setViewerState (vState: ViewerState) {
      const vs2 = <FunctionCurveViewer.ViewerState>{};
      const components = vState.components.slice();        // (we only make a shallow copy, caller must not alter deep content)
      components.sort((a: Component, b: Component) => a.frequency - b.frequency); // sort components by frequency
      this.components = components;
      const maxFrequency = (components.length > 0) ? components[components.length - 1].frequency : 10000;
      const maxAmplitude = this.findMaxAmplitude();
      vs2.viewerFunction = this.spectrumCurveFunction;
      vs2.xMin = vState.xMin || 0;
      vs2.xMax = (vState.xMax != undefined) ? vState.xMax : Math.max(1E-99, roundUp10(maxFrequency * 1.02));
      vs2.yMax = (vState.yMax != undefined) ? vState.yMax : Math.ceil((maxAmplitude) / 10) * 10 + 5;
      vs2.yMin = (vState.yMin != undefined) ? vState.yMin : vs2.yMax - Math.max(1E-99, this.style.defaultAmplitudeRange);
      vs2.gridEnabled = true;
      vs2.xAxisUnit = "Hz";
      vs2.yAxisUnit = "dB";
      vs2.primaryZoomMode = FunctionCurveViewer.ZoomMode.x;
      vs2.focusShield = vState.focusShield;
      this.fcvWidget.setViewerState(vs2); }

   private findMaxAmplitude() : number {
      let max = 0;
      for (let i = 0; i < this.components.length; i++) {
         max = Math.max(max, this.components[i].amplitude); }
      return max; }

   private spectrumCurveFunction = (x: number, sampleWidth: number) => {
      const c = this.components;
      const n = c.length;
      const width = sampleWidth * this.style.componentLineWidth;
      const fMin = x - width / 2;
      const fMax = x + width / 2;
      let p = this.findFrequency(fMin);
      if (p >= n) {
         return; }
      let maxAmplitude = undefined;
      while (p < n && c[p].frequency < fMax) {
         const amplitude = c[p].amplitude;
         maxAmplitude = (maxAmplitude == undefined) ? amplitude : Math.max(maxAmplitude, amplitude);
         p++; }
      if (maxAmplitude == undefined) {
         return; }
      return [-1E99, maxAmplitude]; };

   // Returns the position of the first component with frequency >= x.
   private findFrequency (x: number) : number {
      const c = this.components;
      const n = c.length;
      // Speed optimization using this.componentsPos is done with the assumption that the x values normally increase.
      let p = this.componentsPos || 0;                     // result position of the previous run
      if (p > n || p > 0 && c[p - 1].frequency >= x) {     // if out of sync with current components array
         p = 0; }                                          // restart from the beginning of the array
      while (p < n && c[p].frequency < x) {
         p++; }
      this.componentsPos = p;                              // save position as start value for next run
      return p; }}

// Rounds up to the next multiple of a decimal unit.
function roundUp10 (x: number) : number {
   if (x < 1E-99) {
      return 1; }
   const unit = Math.pow(10, Math.floor(Math.log10(x)));
   return Math.ceil(x / unit) * unit; }

export class Widget {

   private wctx:             WidgetContext;

   constructor (canvas: HTMLCanvasElement, connected = true) {
      this.wctx = new WidgetContext(canvas);
      if (connected) {
         this.setConnected(true); }}

   // Called after the widget is inserted into or removed from the DOM.
   public setConnected (connected: boolean) {
      this.wctx.setConnected(connected); }

   // Returns the current state of the spectrum viewer.
   public getViewerState() : ViewerState {
      return this.wctx.getViewerState(); }

   // Updates the current state of the spectrum viewer.
   public setViewerState (vState: ViewerState) {
      this.wctx.setViewerState(vState); }

   // Returns the help text as an array.
   public getRawHelpText() : string[] {
      return this.wctx.fcvWidget.getRawHelpText(); }

   // Returns the help text as a HTML string.
   public getFormattedHelpText() : string {
      return this.wctx.fcvWidget.getFormattedHelpText(); }}
