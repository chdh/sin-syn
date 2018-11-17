// Sine synthesizer generator.

// Generator parameters.
export interface GeneratorParms {
   duration:       number;             // duration in seconds
   fadingDuration: number;             // fade-in/out duration in seconds
   components:     ComponentParms[]; } // sine components

// Sine component parameters.
export interface ComponentParms {
   frequency:      number;             // frequency in Hz
   amplitude:      number;             // relative amplitude in dB
   phase:          number; }           // phase as a value between 0 and 1

// Generator function.
// @param t
//    time position in seconds
// @return
//    audio sample value at time t, a value within the range -1 to 1
export type GeneratorFunction = (t: number) => number;

export function createGeneratorFunction (gParms: GeneratorParms) : GeneratorFunction {
   const n = gParms.components.length;
   const fadeInPos = Math.min(gParms.fadingDuration, gParms.duration / 2);
   const fadeOutPos = Math.max(gParms.duration - gParms.fadingDuration, gParms.duration / 2);
   const amplitudes: number[] = Array(n);                  // linear amplitudes
   for (let i = 0; i < n; i++) {
      amplitudes[i] = convertDbToLinear(gParms.components[i].amplitude); }
   normalizeMaxAmplitude(amplitudes, 0.99);
   limitMaxPower(amplitudes, 0.5);
   const phases: number[] = Array(n);
   for (let i = 0; i < n; i++) {
      phases[i] = 2 * Math.PI * gParms.components[i].phase; }
   const omega: number[] = Array(n);
   for (let i = 0; i < n; i++) {
      omega[i] = 2 * Math.PI * gParms.components[i].frequency; }
   return function (t: number) : number {
      let a = 0;
      if (t < 0 || t >= gParms.duration) {
         return 0; }
      for (let i = 0; i < n; i++) {
         a += Math.sin(phases[i] + t * omega[i]) * amplitudes[i]; }
      if (t < fadeInPos) {
         a *= fadingFactor(t / gParms.fadingDuration); }
       else if (t > fadeOutPos) {
         a *= fadingFactor((gParms.duration - t) / gParms.fadingDuration); }
      return a; }; }

function convertDbToLinear (dB: number) {
   return Math.pow(10, dB / 20); }

function normalizeMaxAmplitude (amplitudes: number[], maxOverallAmplitude: number) {
   var a = 0;
   for (let i = 0; i < amplitudes.length; i++) {
      a += Math.abs(amplitudes[i]); }
   if (a == 0) {
      return; }
   const f = maxOverallAmplitude / a;
   for (let i = 0; i < amplitudes.length; i++) {
      amplitudes[i] *= f; }}

function limitMaxPower (amplitudes: number[], maxOverallPower: number) {
   var power = 0;
   for (let i = 0; i < amplitudes.length; i++) {
      power += Math.pow(amplitudes[i], 2); }
   if (power <= maxOverallPower) {
      return; }
   const f = Math.sqrt(maxOverallPower / power);
   for (let i = 0; i < amplitudes.length; i++) {
      amplitudes[i] *= f; }}

// Returns the fading factor for the amplitude.
// t is the relative time within the range 0 .. 1.
function fadingFactor (t: number) {
   return Math.pow(t, 2 * (1 - t)); }
