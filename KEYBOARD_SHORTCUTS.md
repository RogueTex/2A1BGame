# Keyboard Shortcuts

This document tracks the planned keyboard shortcut implementation for 2A1BGame.

## Planned Shortcuts

| Key | Action |
|-----|--------|
| ↑ / W | Move tiles Up |
| → / D | Move tiles Right |
| ↓ / S | Move tiles Down |
| ← / A | Move tiles Left |
| R | Restart game |
| H | Show/hide help |

## Implementation Notes

Keyboard shortcuts will be added to the main game loop via `addEventListener('keydown', handler)`.
The handler should ignore events when input fields are focused.

## References

- Closes #1
- See also: MDN KeyboardEvent documentation
