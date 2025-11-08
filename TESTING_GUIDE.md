# PromptSys Testing Guide

## Quick Start - Testing the Graph Visualization

### Option 1: Demo Data (No API Key Required) ⭐ RECOMMENDED FOR TESTING

This is the fastest way to verify the graph is working correctly:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open the application:**
   - Navigate to `http://localhost:3000`
   - The side panel should be open on the left

3. **Load demo data:**
   - Click the purple **"Load Demo Data"** button
   - You should immediately see:
     - 7 nodes arranged in a hierarchical layout
     - Colored nodes representing different categories (Role, Objective, Instruction, etc.)
     - Animated edges showing relationships between nodes
     - A minimap in the bottom right corner
     - Zoom controls in the bottom left
     - A legend showing connection types in the bottom left

4. **Verify interactivity:**
   - ✅ **Pan**: Click and drag on the background
   - ✅ **Zoom**: Use mouse wheel or zoom controls
   - ✅ **Move nodes**: Click and drag individual nodes
   - ✅ **Select nodes**: Click on a node to select it
   - ✅ **Edit nodes**: Click the edit icon (pencil) on any node
   - ✅ **Delete nodes**: Click the X icon on any node
   - ✅ **Create connections**: Drag from the bottom handle of one node to the top handle of another
   - ✅ **View minimap**: Check the minimap for an overview of the graph

### Option 2: With OpenAI API

To test the full AI-powered analysis:

1. **Get an OpenAI API key:**
   - Visit https://platform.openai.com/api-keys
   - Create a new API key

2. **Enter the API key:**
   - Paste your API key in the "OpenAI API Key" field

3. **Analyze a prompt:**
   - Use the sample prompt in `examples/sample-prompt.md`, or
   - Paste your own system prompt

4. **Click "Analyze Prompts":**
   - Wait for the AI to analyze (10-30 seconds)
   - The graph will appear with automatically detected:
     - Categorized nodes
     - Relationships between components
     - Potential conflicts

## Expected Graph Behavior

### Visual Appearance

**The graph should display with:**
- ✅ Nodes are visible and positioned within the viewport
- ✅ Edges connect nodes with smooth curves
- ✅ Different node colors based on category:
  - Blue: Instructions
  - Green: Context
  - Red: Constraints
  - Yellow: Examples
  - Purple: Roles
  - Indigo: Objectives
  - Pink: Format
  - Orange: Persona
  - Dark Red: Guardrails
  - Cyan: Tools
  - Teal: Workflows

**Automatic Layout:**
- ✅ Nodes are arranged hierarchically
- ✅ Root nodes at the top
- ✅ Dependent nodes below
- ✅ Proper spacing between nodes
- ✅ No overlapping (for demo data)

### Interactive Features

**Navigation:**
- ✅ Smooth panning with mouse drag
- ✅ Zoom with mouse wheel
- ✅ Zoom controls work
- ✅ Fit view automatically adjusts when nodes change
- ✅ Minimap reflects current view

**Node Manipulation:**
- ✅ Drag nodes to reposition
- ✅ Position updates persist
- ✅ Click to select (blue outline)
- ✅ Edit title and content inline
- ✅ Delete nodes with confirmation
- ✅ Changes save immediately

**Connection Management:**
- ✅ Create new connections by dragging handles
- ✅ Connections show appropriate colors
- ✅ Edge labels display relationship type
- ✅ Animated edges for dependencies/precedence
- ✅ Delete connections by selecting and removing

## Troubleshooting Common Issues

### Graph Not Visible

**Issue:** The graph area is blank or shows no nodes

**Solutions:**
1. Click "Load Demo Data" button
2. Check browser console for errors (F12)
3. Verify the node count in the header (should show "7 Nodes" for demo)
4. Try refreshing the page
5. Clear browser cache

### Nodes Outside Viewport

**Issue:** Nodes exist but are not in view

**Solutions:**
1. Use the zoom controls to zoom out
2. Check the minimap - it shows where nodes are
3. Click directly on the minimap to jump to that area
4. The graph should auto-fit when nodes are loaded
5. Try loading demo data again

### Performance Issues

**Issue:** Graph is slow or laggy

**Solutions:**
1. Reduce number of nodes (< 50 recommended)
2. Close browser dev tools
3. Disable unnecessary browser extensions
4. Use a modern browser (Chrome, Firefox, Edge)
5. Check if other applications are using CPU

### API Analysis Not Working

**Issue:** Analysis button doesn't work or shows errors

**Solutions:**
1. Verify API key is correct (starts with "sk-")
2. Check internet connection
3. Ensure OpenAI account has credits
4. Try a shorter prompt first
5. Check browser console for detailed errors

## Testing Checklist

### Basic Functionality
- [ ] Application loads without errors
- [ ] Side panel is visible and toggleable
- [ ] Demo data button works
- [ ] Graph displays 7 nodes
- [ ] Nodes are visible in viewport
- [ ] Edges connect nodes correctly
- [ ] Legend shows all connection types
- [ ] Minimap displays correctly

### Interactivity
- [ ] Can pan the graph
- [ ] Can zoom in/out
- [ ] Can select nodes
- [ ] Can drag nodes
- [ ] Can edit node content
- [ ] Can delete nodes
- [ ] Can create connections
- [ ] Changes persist

### Visual Quality
- [ ] Nodes have correct colors
- [ ] Text is readable
- [ ] Handles are visible on hover
- [ ] Selection indicator appears
- [ ] Animations are smooth
- [ ] Layout is organized
- [ ] No visual glitches

### Advanced Features
- [ ] Conflict detection works
- [ ] Conflict panel appears
- [ ] Category badges display
- [ ] Complexity indicators show
- [ ] Edge labels are readable
- [ ] Minimap navigation works
- [ ] Controls panel works

### With OpenAI API
- [ ] API key input works
- [ ] File upload works
- [ ] Text paste works
- [ ] Analysis completes
- [ ] Nodes are categorized
- [ ] Edges are suggested
- [ ] Conflicts detected
- [ ] Layout is automatic

## Performance Benchmarks

**Demo Data Load:**
- Should appear instantly (< 100ms)
- Fit view animation: ~400ms
- Smooth 60fps interaction

**With OpenAI API:**
- Analysis time: 10-30 seconds (depending on content)
- Node creation: < 1 second
- Layout calculation: < 1 second

**Graph Limits:**
- Recommended: < 50 nodes
- Maximum tested: 100 nodes
- Edge limit: ~200 edges

## Browser Compatibility

**Fully Supported:**
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

**Not Supported:**
- ❌ Internet Explorer
- ❌ Browsers with JavaScript disabled

## Development Testing

### Build Verification
```bash
# Type checking
npx tsc --noEmit

# Production build
npm run build

# Preview build
npm run preview
```

### Console Checks
Open browser console (F12) and verify:
- No errors in console
- No warnings about React
- ReactFlow initialized message
- State updates working

### React DevTools
Install React DevTools and check:
- Component tree renders correctly
- State updates propagate
- No unnecessary re-renders
- Hooks work correctly

## Reporting Issues

If you encounter issues:

1. **Check console errors** (F12)
2. **Note exact steps** to reproduce
3. **Record browser version**
4. **Screenshot the issue**
5. **Check network tab** for API failures

Report with:
- Steps to reproduce
- Expected vs actual behavior
- Browser and version
- Console errors
- Screenshots

## Success Criteria

The graph visualization is working correctly if:

✅ Demo data loads and displays within 1 second
✅ All 7 nodes are visible in viewport
✅ Nodes can be dragged and repositioned
✅ Edges connect nodes with smooth curves
✅ fitView automatically adjusts viewport
✅ Pan and zoom work smoothly
✅ Edit and delete operations work
✅ No console errors
✅ Minimap shows correct layout
✅ Legend displays all connection types

---

## Next Steps

Once basic functionality is verified:

1. Test with real system prompts
2. Experiment with different prompt structures
3. Try complex multi-section prompts
4. Test conflict detection
5. Explore manual graph editing
6. Export/save functionality (coming soon)

Happy testing! 🚀
