// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, WritableStream, TransformStream } from 'stream/web';

if (!global.TextEncoder) {
	global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
	global.TextDecoder = TextDecoder;
}

if (!global.ReadableStream) {
	global.ReadableStream = ReadableStream;
}

if (!global.WritableStream) {
	global.WritableStream = WritableStream;
}

if (!global.TransformStream) {
	global.TransformStream = TransformStream;
}
