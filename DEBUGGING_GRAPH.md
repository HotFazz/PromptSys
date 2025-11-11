# Debugging the Ontology Graph Visualization

## Problem Statement

The ontology graph is not appearing correctly even though:
- ✅ Conflicts are being detected (data processing works)
- ✅ TypeScript compiles without errors
- ✅ Application builds successfully
- ❌ Graph visualization doesn't render properly

This means the data flow is working but the visual rendering is broken.

## Debug Strategy

Follow these steps to identify exactly where the rendering pipeline breaks:

### Step 1: Start Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Step 2: Open Browser Console

Press **F12** (or Cmd+Option+I on Mac) to open Developer Tools.
Navigate to the **Console** tab.

### Step 3: Load Demo Data

Click the purple **"Load Demo Data"** button in the side panel.

### Step 4: Analyze Console Output

You should see a sequence of console logs. Compare what you see with the expected output below:

#### Expected Console Output (Success):

```
Rendering OntologyGraph wrapper
Store nodes changed: 7 [Array(7)]
  ▶ (7) [{id: "node-...", title: "Customer Support Role", ...}, ...]
Store edges changed: 7 [Array(7)]
  ▶ (7) [{id: "edge-...", source: "node-...", target: "node-...", ...}, ...]
Setting React Flow nodes: 7 [Array(7)]
  ▶ (7) [{id: "node-...", type: "promptNode", position: {x: 0, y: 0}, ...}, ...]
Setting React Flow edges: 7 [Array(7)]
  ▶ (7) [{id: "edge-...", source: "node-...", target: "node-...", type: "smoothstep", ...}, ...]
Rendering OntologyGraphInner with nodes: 7 edges: 7
Fitting view to nodes...
```

### Step 5: Identify the Break Point

#### Scenario A: No Console Logs at All

**Problem**: Component not rendering
**Check**:
- Is the side panel actually open?
- Did you click "Load Demo Data"?
- Are there any React errors in the console?
- Check Network tab for failed resource loads

#### Scenario B: "Store nodes changed: 0"

**Problem**: Demo data not loading
**Check**:
- Open `src/utils/demoData.ts` - does it exist?
- Check `src/components/SidePanel.tsx` - is `handleLoadDemo` called?
- Look for errors when clicking the button

#### Scenario C: Logs Stop After "Store nodes changed"

**Problem**: React Flow nodes not being created
**Likely Cause**: Issue in the useEffect that transforms store nodes
**Check**:
- `src/components/OntologyGraph.tsx` line 52-71
- Are the positions valid? Log them: `console.log(node.position)`

#### Scenario D: Logs Stop After "Setting React Flow nodes"

**Problem**: React Flow not rendering
**Likely Causes**:
1. Container doesn't have proper dimensions
2. React Flow Provider not working
3. CSS issues

**Check**:
- Inspect the DOM element with class containing "react-flow"
- Check computed height/width of the container
- Verify ReactFlow component is in the DOM

#### Scenario E: All Logs Present But No Visual

**Problem**: Nodes exist but aren't visible
**Likely Causes**:
1. Nodes are positioned outside viewport
2. CSS z-index issues
3. Color/opacity making nodes invisible

**Debugging**:
```javascript
// In browser console, check React Flow internals:
const rf = window.reactFlowInstance; // if exposed
console.log(rf.getNodes());
console.log(rf.getViewport());
```

### Step 6: Inspect DOM Structure

In the **Elements** tab of Dev Tools, look for this structure:

```html
<div class="flex-1 relative overflow-hidden">
  <div style="width: 100%; height: 100%;">  <!-- OntologyGraph wrapper -->
    <div style="width: 100%; height: 100%; position: relative;">  <!-- OntologyGraphInner -->
      <div class="react-flow">  <!-- React Flow Container -->
        <div class="react-flow__renderer">
          <div class="react-flow__viewport">
            <div class="react-flow__edges">...</div>
            <div class="react-flow__nodes">
              <!-- Your nodes should be here -->
              <div class="react-flow__node" ...>
                <!-- PromptNode content -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Check**:
- ✅ Does `.react-flow` exist?
- ✅ Does it have a height > 0?
- ✅ Are there elements in `.react-flow__nodes`?
- ✅ Do nodes have valid `transform` CSS?

### Step 7: Check Computed Styles

Select the `.react-flow` container in Elements tab, look at **Computed** styles:

**Critical values**:
- `height`: Should be a pixel value, not 0
- `width`: Should be a pixel value, not 0
- `position`: Should be "relative"
- `overflow`: Should be "hidden"

If `height: 0px` or `width: 0px`, the container isn't sized properly.

### Step 8: Verify Node Positions

In console, check if demo data positions are valid:

```javascript
// Paste in console after loading demo data:
const store = window.__ZUSTAND_STORE__; // if exposed
console.log(store.getState().nodes.map(n => ({
  id: n.id,
  title: n.title,
  x: n.position.x,
  y: n.position.y
})));
```

Expected output should show varying x/y values like:
```javascript
[
  {id: "...", title: "Customer Support Role", x: 0, y: 0},
  {id: "...", title: "Primary Objective", x: 0, y: 200},
  {id: "...", title: "Tone Guidelines", x: -300, y: 400},
  // ...
]
```

If all positions are `{x: 0, y: 0}`, layout calculation failed.

## Common Issues & Fixes

### Issue 1: React Flow Container Has No Height

**Symptom**: `.react-flow` has `height: 0px`

**Root Cause**: Parent container doesn't have explicit height

**Fix**:
```tsx
// In App.tsx, line 45:
<div className="flex-1 relative overflow-hidden" style={{ height: '100%' }}>
```

Or verify that `flex-1` is actually computing to a height by checking parent chain.

### Issue 2: Nodes Render But Are Invisible

**Symptom**: DOM shows nodes but they're not visible

**Possible Causes**:
1. **Z-index issues**: Check if something is covering the canvas
2. **Opacity**: Nodes might have `opacity: 0`
3. **Off-screen**: Nodes positioned way outside viewport

**Fix**:
```javascript
// In console, manually fit view:
document.querySelector('.react-flow__controls-fitview')?.click();

// Or force zoom out:
document.querySelector('.react-flow__controls-zoomout')?.click();
```

### Issue 3: React Flow Not Initializing

**Symptom**: `.react-flow` div doesn't exist at all

**Possible Causes**:
1. ReactFlowProvider not working
2. Import error
3. React version mismatch

**Check**:
```bash
# Verify dependencies:
npm list reactflow react react-dom

# Should show compatible versions
```

### Issue 4: FitView Not Working

**Symptom**: Nodes exist but viewport doesn't center on them

**Debug**:
Add this temporarily to `OntologyGraph.tsx` after line 113:

```typescript
console.log('FitView config:', {
  padding: 0.3,
  duration: 800,
  nodes: nodes.length,
  reactFlowInstance: !!reactFlowInstance
});

// Log viewport after fitView
setTimeout(() => {
  const vp = reactFlowInstance.getViewport();
  console.log('Viewport after fitView:', vp);
}, 1000);
```

## Advanced Debugging

### Enable React DevTools

Install React DevTools browser extension, then:

1. Open DevTools → Components tab
2. Find `OntologyGraphInner` component
3. Check its state:
   - `nodes` - should be array with 7 items
   - `edges` - should be array with 7 items
   - `isInitialized` - should be `true`

### Monitor State Changes

Add this to `OntologyGraphInner` to track all state changes:

```typescript
useEffect(() => {
  console.log('STATE UPDATE:', {
    storeNodes: storeNodes.length,
    storeEdges: storeEdges.length,
    flowNodes: nodes.length,
    flowEdges: edges.length,
    isInitialized
  });
}, [storeNodes, storeEdges, nodes, edges, isInitialized]);
```

### Check React Flow Instance

Verify React Flow is properly instantiated:

```typescript
// Add to OntologyGraphInner:
useEffect(() => {
  console.log('React Flow Instance:', {
    exists: !!reactFlowInstance,
    methods: reactFlowInstance ? Object.keys(reactFlowInstance) : []
  });
}, [reactFlowInstance]);
```

## If Nothing Works

### Nuclear Option 1: Simplify to Bare Minimum

Create a test file `src/components/SimpleGraphTest.tsx`:

```typescript
import ReactFlow, { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';

const nodes = [
  {
    id: '1',
    position: { x: 100, y: 100 },
    data: { label: 'Test Node' },
  },
];

export function SimpleGraphTest() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlowProvider>
        <ReactFlow nodes={nodes} fitView />
      </ReactFlowProvider>
    </div>
  );
}
```

Replace `<OntologyGraph />` with `<SimpleGraphTest />` in App.tsx.

If this doesn't work, React Flow itself isn't rendering, which means:
- Dependency issue
- CSS not loading
- React version incompatibility

### Nuclear Option 2: Fresh Install

```bash
# Remove all dependencies
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install

# Rebuild
npm run build
```

### Nuclear Option 3: Check for Conflicting Global CSS

Comment out `src/styles/index.css` temporarily to see if custom CSS is breaking React Flow.

## Reporting Results

After following this guide, report:

1. **Console output** - Copy all logs
2. **DOM structure** - Screenshot of Elements tab
3. **Computed styles** - Height/width of `.react-flow`
4. **Which step failed** - Where did the logs stop?
5. **Any errors** - Red errors in console
6. **Browser version** - Chrome/Firefox/etc
7. **Node positions** - Are they valid numbers?

This information will pinpoint the exact issue.
