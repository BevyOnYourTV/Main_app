# AI generated guidance

1. Spatial navigation styling
- Treat Norigin focus state as component state, not as a reason to use inline `style` props.
- For focusable leaf elements, attach the `useFocusable` ref directly to the semantic interactive element and expose `focused` through `data-spatial-focused`.
- For focusable containers that visually react to child focus, enable `trackChildren`, read `hasFocusedChild`, and expose it through `data-has-focused-child`. Do not enable `trackChildren` when the value is not used.
- Define reusable spatial-navigation presentation in the Tailwind `components` layer and target the state attributes there, for example `.tv-link[data-spatial-focused='true']`.
- Keep component class names stable. Do not construct partial Tailwind class names dynamically.
- Preserve native semantics: use links for navigation and buttons for actions. Add Norigin `onEnterPress` behavior without replacing native click, keyboard, or focus behavior.
- Always provide both spatial-focus styling and native `:focus-visible` styling because Norigin focus and browser focus are separate states.
- Containers must provide their `focusKey` through `FocusContext.Provider`, and every `useFocusable` ref must be attached to a real DOM element.

2. UI and component usage
- Use shadcn/ui for conventional interface elements.
- Create new components for the project-specific design system and screens.
- Always extract components into their own files so they can be tested independently.
- Always write corresponding tests for newly generated components.
