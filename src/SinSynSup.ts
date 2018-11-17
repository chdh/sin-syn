// Sine synthesizer support functions.

import {ComponentParms} from "./SinSynGen";

// Parses a components string.
// Syntax of the components string:
//    frequency1[/amplitude1[/phase1]] frequency2[/amplitude2[/phase2]] ...
// Examples:
//    440 660 880
//    440/0 660/-10 880/-20
//    235.5 *3/-2.5 *5/-6 *7/-17 *9/-6 *11/-18.4 *13/-15.4
//    440/0/0 443/0/0.5
// A component has one of the following formats:
//    frequency
//    frequency/amplitude
//    frequency/amplitude/phase
// The frequency is absolute in Hz or a relative in the format "*factor".
// A relative frequency, specified with "*", is relative to the last absolute frequency.
// The amplitude is in dB.
// The phase is a number in the range 0 to 1, where 1 corresponds to a phase of 2 PI in radians.
export function parseComponentParmsString (s: string) : ComponentParms[] {
   let p = 0;
   const components: ComponentParms[] = Array(0);
   let lastAbsoluteFrequency = 1;
   while (true) {
      skipBlanks();
      if (p >= s.length) {
         break; }
      let frequencyIsRelative = false;
      if (s[p] == '*') {
         frequencyIsRelative = true;
         p++; }
      let frequency = parseNumber();
      if (frequency < 0) {
         throw new Error("Negative frequency value in components string."); }
      if (frequencyIsRelative) {
         frequency *= lastAbsoluteFrequency; }
       else {
         lastAbsoluteFrequency = frequency; }
      skipBlanks();
      let amplitude = 0;
      let phase = 0;
      if (s[p] == "/") {
         p++;
         skipBlanks();
         amplitude = parseNumber();
         skipBlanks();
         if (s[p] == "/") {
            p++;
            skipBlanks();
            phase = parseNumber(); }}
      const component: ComponentParms = {frequency, amplitude, phase};
      components.push(component);
      skipBlanks();
      if (s[p] == ",") {
         p++; }}
   return components;
   //
   function skipBlanks() {
      while (p < s.length && s[p] == " ") {
         p++; }}
   //
   function parseNumber() : number {
      const p0 = p;
      if (s[p] == "+" || s[p] == "-") {
         p++; }
      while (p < s.length) {
         const c = s[p];
         if (!(c >= "0" && c <= "9" || c == ".")) {
            break; }
         p++; }
      const x = decodeNumber(s.substring(p0, p));
      if (!isFinite(x)) {
         throw new Error("Syntax error in components string. Number expected at position " + (p0 + 1) + "."); }
      return x; }}

function decodeNumber (s: string) : number {
   if (!s) {
      return NaN; }
   return Number(s); }
