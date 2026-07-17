# Access Spectrum

Integration is not an either-or of "fully automatic vs fully manual", but a spectrum: **low floor + high ceiling**, combined as needed.

## Three layers

### Layer 1: auto-inference (zero changes)

Presets scan the existing code structure at build time and generate the capability manifest with zero changes:

- `preset-react-router` scans the route config to get the module list.
- `preset-antd` scans antd `<Form.Item>` to get the field list (including types and Select options).

For most internal-tool scenarios this layer is enough.

### Layer 2: config gap-filling

Where auto-inference can't reach (e.g. data-driven routes, cross-file constants), fill the gaps with a config file:

```ts
reactRouterPreset({
  routesFile: 'src/App.tsx',
  labels: { '/leave': 'Leave', '/expense': 'Expense' },
});
```

### Layer 3: manual annotation

When accuracy demands are highest, or the structure can't be inferred statically, annotate precisely with `data-ai-*` attributes:

```tsx
<button data-ai-action="leave.submit" data-ai-label="Submit" data-ai-confirm>Submit</button>
<input data-ai-field="leave.days" data-ai-label="Days" data-ai-type="number" />
```

## Priority

**Manual annotation overrides seeds**: a manual annotation for a given id takes priority over the preset's auto-inferred seed. Auto-inference is the floor, manual annotation the ceiling — you can annotate only the critical operations and leave the rest to auto-inference.

## An honest boundary

- Auto-inference accuracy < manual annotation — that's physics.
- Loop-generated fields (non-literal names) and API/state-driven options are invisible to static scanning — these are physical boundaries, left to runtime or manual annotation.
