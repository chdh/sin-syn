// SinSyn web application

import {GeneratorParms, createGeneratorFunction, GeneratorFunction} from "./SinSynGen";
import * as SinSynSup from "./SinSynSup";
import * as SpectrumViewer from "./SpectrumViewer";
import * as Utils from "./Utils";
import {setNumberInputElementValue, getNumberInputElementValue, getNumericUrlSearchParam} from "./Utils";

import * as FunctionCurveViewer from "function-curve-viewer";
import * as WavFileEncoder from "wav-file-encoder";

var audioContext:          AudioContext;
var componentsElement:     HTMLInputElement;
var durationElement:       HTMLInputElement;
var fadingDurationElement: HTMLInputElement;
var spectrumXMinElement:   HTMLInputElement;
var spectrumXMaxElement:   HTMLInputElement;
var spectrumYMinElement:   HTMLInputElement;
var spectrumYMaxElement:   HTMLInputElement;
var playButtonElement:     HTMLButtonElement;
var spectrumViewerElement: HTMLCanvasElement;
var spectrumViewerWidget:  SpectrumViewer.Widget;
var curveViewerElement:    HTMLCanvasElement;
var curveViewerWidget:     FunctionCurveViewer.Widget;
var curveViewerInitDone:   boolean = false;
var gcdElement:            HTMLElement;
var activeAudioSourceNode: AudioBufferSourceNode | undefined;        // (TODO: change to AudioScheduledSourceNode when defined in TypeScript)

//--- UI parameters ------------------------------------------------------------

interface UiParms {
   components:     string;
   duration:       number;
   fadingDuration: number;
   spectrumXMin?:  number;
   spectrumXMax?:  number;
   spectrumYMin?:  number;
   spectrumYMax?:  number; }

const defaultUiParms: UiParms = {
   components:     "440",
   duration:       1,
   fadingDuration: 0.02 };

function setUiParms (uiParms: UiParms) {
   durationElement.valueAsNumber = uiParms.duration;
   fadingDurationElement.valueAsNumber = uiParms.fadingDuration;
   componentsElement.value = uiParms.components;
   setNumberInputElementValue(spectrumXMinElement, uiParms.spectrumXMin);
   setNumberInputElementValue(spectrumXMaxElement, uiParms.spectrumXMax);
   setNumberInputElementValue(spectrumYMinElement, uiParms.spectrumYMin);
   setNumberInputElementValue(spectrumYMaxElement, uiParms.spectrumYMax); }

// When a parameter is invalid, an error message is displayed, the cursor is placed within
// the affected field and the return value is undefined.
function getUiParms() : UiParms | undefined {
   if (!durationElement.reportValidity()) {
      return; }
   if (!fadingDurationElement.reportValidity()) {
      return; }
   let uiParms = <UiParms>{};
   uiParms.components = componentsElement.value;
   uiParms.duration = durationElement.valueAsNumber;
   uiParms.fadingDuration = fadingDurationElement.valueAsNumber;
   uiParms.spectrumXMin = getNumberInputElementValue(spectrumXMinElement);
   uiParms.spectrumXMax = getNumberInputElementValue(spectrumXMaxElement);
   uiParms.spectrumYMin = getNumberInputElementValue(spectrumYMinElement);
   uiParms.spectrumYMax = getNumberInputElementValue(spectrumYMaxElement);
   return uiParms; }

// When a parameter is invalid, an error message is displayed, the cursor is placed within
// the affected field and the return value is undefined.
function getGeneratorParms (uiParms: UiParms) : GeneratorParms | undefined {
   let gParms = <GeneratorParms>{};
   gParms.duration = uiParms.duration;
   gParms.fadingDuration = uiParms.fadingDuration;
   try {
      gParms.components = SinSynSup.parseComponentParmsString(uiParms.components); }
    catch (e) {
      const msg = e.message || e.toString();
      componentsElement.setCustomValidity(msg);
      componentsElement.reportValidity();
      return; }
   return gParms; }

function getFrequencies (gParms: GeneratorParms) : number[] {
   const n = gParms.components.length;
   const a = <number[]>Array(n);
   for (let i = 0; i < n; i++) {
      a[i] = gParms.components[i].frequency; }
   return a; }

//--- Audio player -------------------------------------------------------------

function audioEndedEventHandler() {
   disposeActiveAudioSource();
   refreshPlayButton(); }

function isAudioPlaying() : boolean {
   return !!activeAudioSourceNode; }

function stopAudioPlayer() {
   disposeActiveAudioSource(); }

function disposeActiveAudioSource() {
   if (!activeAudioSourceNode) {
      return; }
   const sourceNode = activeAudioSourceNode;
   activeAudioSourceNode = undefined;
   sourceNode.stop();
   sourceNode.disconnect();
   sourceNode.removeEventListener("ended", audioEndedEventHandler); }

function playAudioBuffer (buffer: AudioBuffer) {
   disposeActiveAudioSource();
   const sourceNode = audioContext.createBufferSource();
   sourceNode.buffer = buffer;
   sourceNode.connect(audioContext.destination);
   sourceNode.addEventListener("ended", audioEndedEventHandler);
   sourceNode.start();
   activeAudioSourceNode = sourceNode; }

function createAudioBuffer (generator: GeneratorFunction, duration: number) : AudioBuffer {
   const sampleRate = audioContext.sampleRate;
   const samples = Math.ceil(duration * sampleRate);
   const buffer = audioContext.createBuffer(1, samples, sampleRate);
   const data = buffer.getChannelData(0);
   for (let i = 0; i < samples; i++) {
      data[i] = generator(i / sampleRate); }
   return buffer; }

function createAudioBufferFromUiParms() : AudioBuffer | undefined {
   const uiParms = getUiParms();
   if (!uiParms) {
      return; }
   const gParms = getGeneratorParms(uiParms);
   if (!gParms) {
      return; }
   const generator = createGeneratorFunction(gParms);
   return createAudioBuffer(generator, gParms.duration); }

function playAudio() : boolean {
   const audioBuffer = createAudioBufferFromUiParms();
   if (!audioBuffer) {
      return false; }
   playAudioBuffer(audioBuffer);
   return true; }

function refreshPlayButton() {
   playButtonElement.textContent = activeAudioSourceNode ? "Stop" : "Play"; }

function playButton_click2() {
   resumeAudioContext();
   if (isAudioPlaying()) {
      stopAudioPlayer(); }
    else {
      if (!playAudio()) {
         return; }}
   refreshAll(); }

function playButton_click() {
   try {
      playButton_click2(); }
    catch (e) {
      alert("Error: " + e); }}

//--- Spectrum viewer ----------------------------------------------------------

function setSpectrumViewer (uiParms: UiParms, gParms: GeneratorParms) {
   const vState = <SpectrumViewer.ViewerState>{
      components: gParms.components,
      xMin:       uiParms.spectrumXMin,
      xMax:       uiParms.spectrumXMax,
      yMin:       uiParms.spectrumYMin,
      yMax:       uiParms.spectrumYMax };
   spectrumViewerWidget.setViewerState(vState); }

function spectrumViewerHelpButton_click() {
   const t = document.getElementById("spectrumViewerHelpText")!;
   t.innerHTML = spectrumViewerWidget.getFormattedHelpText();
   t.classList.toggle("hidden"); }

function spectrumViewerRangeButton_click() {
   document.getElementById("spectrumViewerRangeParms")!.classList.toggle("hidden"); }

//--- Curve viewer -------------------------------------------------------------

function createCurveViewerFunction (generator: GeneratorFunction, gParms: GeneratorParms) : FunctionCurveViewer.ViewerFunction {
   const maxFrequency = Math.max(...getFrequencies(gParms));
   const curveSamplingFactor = 16;                         // (heuristical value)
   const curveSamplingFrequency = Math.max(1, Math.min(audioContext.sampleRate, maxFrequency * curveSamplingFactor));
   const criticalWidth = 1 / curveSamplingFrequency;
   return FunctionCurveViewer.createEnvelopeViewerFunction(generator, criticalWidth); }

function setCurveViewer (generator: GeneratorFunction, gParms: GeneratorParms) {
   const defaultXRange = 0.01;                             // 10 ms
   const defaultXMin = Math.min(gParms.fadingDuration, gParms.duration / 2 - defaultXRange / 2);
   const oldState = curveViewerWidget.getViewerState();
   const state = <FunctionCurveViewer.ViewerState>{
      viewerFunction:  createCurveViewerFunction(generator, gParms),
      planeOrigin:     curveViewerInitDone ? oldState.planeOrigin : {x: defaultXMin, y: -1},
      zoomFactorX:     curveViewerInitDone ? oldState.zoomFactorX : curveViewerElement.width / defaultXRange,
      zoomFactorY:     curveViewerInitDone ? oldState.zoomFactorY : curveViewerElement.height / 2,
      gridEnabled:     curveViewerInitDone ? oldState.gridEnabled : true,
      xAxisUnit:       "s",
      primaryZoomMode: FunctionCurveViewer.ZoomMode.x};
   curveViewerWidget.setViewerState(state);
   curveViewerInitDone = true; }

function curveViewerHelpButton_click() {
   const t = document.getElementById("curveViewerHelpText")!;
   t.innerHTML = curveViewerWidget.getFormattedHelpText();
   t.classList.toggle("hidden"); }

//--- URL parameters -----------------------------------------------------------

function encodeUrlParms (uiParms: UiParms) : string {
   const usp = new URLSearchParams();
   usp.set("components", uiParms.components);
   usp.set("duration", String(uiParms.duration));
   if (uiParms.fadingDuration != defaultUiParms.fadingDuration) {
      usp.set("fadingDuration", String(uiParms.fadingDuration)); }
   if (uiParms.spectrumXMin) {
      usp.set("spectrumXMin", String(uiParms.spectrumXMin)); }
   if (uiParms.spectrumXMax != undefined) {
      usp.set("spectrumXMax", String(uiParms.spectrumXMax)); }
   if (uiParms.spectrumYMin != undefined) {
      usp.set("spectrumYMin", String(uiParms.spectrumYMin)); }
   if (uiParms.spectrumYMax != undefined) {
      usp.set("spectrumYMax", String(uiParms.spectrumYMax)); }
   let s = usp.toString();
   s = s.replace(/%2F/g, "/");                             // we don't need to and don't want to encode "/"
   return s; }

function decodeUrlParms (urlParmsString: string) : UiParms {
   if (!urlParmsString) {
      return defaultUiParms; }
   const usp = new URLSearchParams(urlParmsString);
   let uiParms = <UiParms>{};
   uiParms.components     = usp.get("components") || defaultUiParms.components;
   uiParms.duration       = getNumericUrlSearchParam(usp, "duration", defaultUiParms.duration)!;
   uiParms.fadingDuration = getNumericUrlSearchParam(usp, "fadingDuration", defaultUiParms.fadingDuration)!;
   uiParms.spectrumXMin   = getNumericUrlSearchParam(usp, "spectrumXMin");
   uiParms.spectrumXMax   = getNumericUrlSearchParam(usp, "spectrumXMax");
   uiParms.spectrumYMin   = getNumericUrlSearchParam(usp, "spectrumYMin");
   uiParms.spectrumYMax   = getNumericUrlSearchParam(usp, "spectrumYMax");
   return uiParms; }

function refreshUrl() : boolean {
   const uiParms = getUiParms();
   if (!uiParms) {
      return false; }
   const urlParmsString = encodeUrlParms(uiParms);
   if (urlParmsString != window.location.hash.substring(1)) {
      window.history.pushState(null, "", "#" + urlParmsString); }
   return true; }

function restoreAppStateFromUrl() {
   stopAudioPlayer();
   const urlParmsString = window.location.hash.substring(1);
   const uiParms = decodeUrlParms(urlParmsString);
   setUiParms(uiParms);
   refreshSignalInfo();
   refreshPlayButton(); }

function restoreAppStateFromUrl_withErrorHandling() {
   try {
      restoreAppStateFromUrl(); }
    catch (e) {
      alert("Unable to restore application state from URL. " + e);
      console.log(e);
      resetApplicationState(); }}

//--- WAV file output ----------------------------------------------------------

function wavFileButton_click() {
   stopAudioPlayer();
   if (!refreshAll()) {
      return; }
   const audioBuffer = createAudioBufferFromUiParms();
   if (!audioBuffer) {
      return; }
   const wavFileData = WavFileEncoder.encodeWavFile(audioBuffer, WavFileEncoder.WavFileType.float32);
   const blob = new Blob([wavFileData], {type: "audio/wav"});
   Utils.openSaveAsDialog(blob, "SinSyn.wav"); }

//------------------------------------------------------------------------------

function refreshGcd (gParms: GeneratorParms) {
   const frequencies = getFrequencies(gParms);
   const gcd = Utils.computeGcd(frequencies);
   const v = (gcd != undefined) ? Math.round(gcd * 1E4) / 1E4 : gcd;
   gcdElement.textContent = String(v); }

function componentsHelpButton_click() {
   document.getElementById("componentsHelpText")!.classList.toggle("hidden"); }

function resetApplicationState() {
   stopAudioPlayer();
   setUiParms(defaultUiParms);
   refreshAll(); }

function refreshSignalInfo() : boolean {
   const uiParms = getUiParms();
   if (!uiParms) {
      return false; }
   const gParms = getGeneratorParms(uiParms);
   if (!gParms) {
      return false; }
   setSpectrumViewer(uiParms, gParms);
   const generator = createGeneratorFunction(gParms);
   setCurveViewer(generator, gParms);
   refreshGcd(gParms);
   return true; }

function refreshAll() : boolean {
   refreshPlayButton();
   if (!refreshSignalInfo()) {
      return false; }
   if (!refreshUrl()) {
      return false; }
   return true; }

function resumeAudioContext() {
   if (audioContext.state == "suspended") {
      audioContext.resume(); }}

function startup2() {
   audioContext = new ((<any>window).AudioContext || (<any>window).webkitAudioContext)();
   componentsElement     = <HTMLInputElement>document.getElementById("components")!;
   durationElement       = <HTMLInputElement>document.getElementById("duration")!;
   fadingDurationElement = <HTMLInputElement>document.getElementById("fadingDuration")!;
   spectrumXMinElement   = <HTMLInputElement>document.getElementById("spectrumXMin")!;
   spectrumXMaxElement   = <HTMLInputElement>document.getElementById("spectrumXMax")!;
   spectrumYMinElement   = <HTMLInputElement>document.getElementById("spectrumYMin")!;
   spectrumYMaxElement   = <HTMLInputElement>document.getElementById("spectrumYMax")!;
   playButtonElement     = <HTMLButtonElement>document.getElementById("playButton")!;
   spectrumViewerElement = <HTMLCanvasElement>document.getElementById("spectrumViewer")!;
   curveViewerElement    = <HTMLCanvasElement>document.getElementById("curveViewer")!;
   gcdElement            = document.getElementById("gcd")!;
   componentsElement.addEventListener("input", () => componentsElement.setCustomValidity(""));
   componentsElement.addEventListener("focusout", () => refreshAll());
   durationElement.addEventListener("focusout", () => refreshAll());
   fadingDurationElement.addEventListener("focusout", () => refreshAll());
   playButtonElement.addEventListener("click", playButton_click)!;
   document.getElementById("spectrumViewerRangeParms")!.addEventListener("focusout", () => refreshAll());
   document.getElementById("componentsHelpButton")!.addEventListener("click", componentsHelpButton_click);
   document.getElementById("wavFileButton")!.addEventListener("click", wavFileButton_click);
   document.getElementById("spectrumViewerHelpButton")!.addEventListener("click", spectrumViewerHelpButton_click);
   document.getElementById("spectrumViewerRangeButton")!.addEventListener("click", spectrumViewerRangeButton_click);
   document.getElementById("curveViewerHelpButton")!.addEventListener("click", curveViewerHelpButton_click);
   spectrumViewerWidget = new SpectrumViewer.Widget(spectrumViewerElement);
   spectrumViewerWidget.connectedCallback();
   curveViewerWidget = new FunctionCurveViewer.Widget(curveViewerElement);
   curveViewerWidget.connectedCallback();
   window.onpopstate = () => restoreAppStateFromUrl_withErrorHandling();
   restoreAppStateFromUrl_withErrorHandling(); }

function startup() {
   try {
      startup2(); }
    catch (e) {
      alert("Error: " + e); }}

document.addEventListener("DOMContentLoaded", startup);

// Missing declaration for TypeScript 2.8:
declare global {
   interface HTMLInputElement {
      reportValidity(): boolean; }}
