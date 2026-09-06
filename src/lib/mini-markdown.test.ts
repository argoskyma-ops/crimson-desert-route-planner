import { describe, expect, it } from 'vitest'
import { parseMiniMarkdown } from './mini-markdown'

describe('parseMiniMarkdown', () => {
  it('splits paragraphs on blank lines', () => {
    expect(parseMiniMarkdown('one\n\ntwo')).toEqual([
      { kind: 'paragraph', children: [{ kind: 'text', text: 'one' }] },
      { kind: 'paragraph', children: [{ kind: 'text', text: 'two' }] },
    ])
  })

  it('joins multi-line paragraphs with a space', () => {
    expect(parseMiniMarkdown('one\ntwo')).toEqual([
      { kind: 'paragraph', children: [{ kind: 'text', text: 'one two' }] },
    ])
  })

  it('parses a list block', () => {
    expect(parseMiniMarkdown('- a\n- b')).toEqual([
      {
        kind: 'list',
        items: [[{ kind: 'text', text: 'a' }], [{ kind: 'text', text: 'b' }]],
      },
    ])
  })

  it('starts a list after a paragraph without a blank line', () => {
    expect(parseMiniMarkdown('hello\n- item')).toEqual([
      { kind: 'paragraph', children: [{ kind: 'text', text: 'hello' }] },
      { kind: 'list', items: [[{ kind: 'text', text: 'item' }]] },
    ])
  })

  it('parses bold inside text', () => {
    expect(parseMiniMarkdown('say **hi** now')).toEqual([
      {
        kind: 'paragraph',
        children: [
          { kind: 'text', text: 'say ' },
          { kind: 'bold', children: [{ kind: 'text', text: 'hi' }] },
          { kind: 'text', text: ' now' },
        ],
      },
    ])
  })

  it('keeps unclosed bold as literal text', () => {
    expect(parseMiniMarkdown('say **hi')).toEqual([
      { kind: 'paragraph', children: [{ kind: 'text', text: 'say **hi' }] },
    ])
  })

  it('parses a valid entity link', () => {
    expect(parseMiniMarkdown('see [[quest:dead-of-night]]')).toEqual([
      {
        kind: 'paragraph',
        children: [
          { kind: 'text', text: 'see ' },
          { kind: 'link', id: 'quest:dead-of-night' },
        ],
      },
    ])
  })

  it('keeps invalid links as text', () => {
    expect(parseMiniMarkdown('[[not an id]] and [[quest:--bad]]')).toEqual([
      {
        kind: 'paragraph',
        children: [{ kind: 'text', text: '[[not an id]] and [[quest:--bad]]' }],
      },
    ])
  })

  it('treats HTML as text', () => {
    expect(parseMiniMarkdown('<b>bold</b>')).toEqual([
      { kind: 'paragraph', children: [{ kind: 'text', text: '<b>bold</b>' }] },
    ])
  })

  it('returns an empty array for empty or whitespace-only input', () => {
    expect(parseMiniMarkdown('')).toEqual([])
    expect(parseMiniMarkdown('   \n\n  ')).toEqual([])
  })
})
