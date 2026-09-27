const fs = require('fs');
const file = 'c:/Users/USER/Desktop/Kreathief/components/Editor.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add wasManuallyCollapsedRef and shouldAutoCollapse logic
content = content.replace(
  '  const showAIOverlay = useStore((state) => state.showAIOverlay);',
  `  const showAIOverlay = useStore((state) => state.showAIOverlay);
  const setShowAIOverlay = useStore((state) => state.setShowAIOverlay);
  const wasManuallyCollapsedRef = useRef(false);

  // Responsive "Sidebar Crush" prevention:
  // When the right AI overlay opens on screens <1536px, auto-collapse the left drawer
  // so the central canvas retains full breathing room.
  const isRightPanelOpen = showAIOverlay && !isMobile;
  const isCrushedScreen = typeof window !== 'undefined' && window.innerWidth < 1536;
  const shouldAutoCollapse = activeTab === NavTab.MOCKUP || (isRightPanelOpen && isCrushedScreen);`
);

// 2. Update Left Toolbar + Drawer wrapper width class
content = content.replace(
  `\${isSidebarCollapsed || activeTab === NavTab.MOCKUP ? 'w-[72px]' : 'w-[392px]'}\``,
  `\${isSidebarCollapsed || shouldAutoCollapse ? 'w-[72px]' : 'w-[392px]'}\``
);

// 3. Update Sidebar props and SidePanel conditional
const oldSidebarBlock = `            <Sidebar
              isCollapsed={isSidebarCollapsed}
              isAutoCollapsed={activeTab === NavTab.MOCKUP}
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onExpand={() => {
                if (useStore.getState().activeTab === NavTab.MOCKUP) {
                  useStore.getState().setActiveTab(NavTab.TEMPLATES);
                }
                setIsSidebarCollapsed(false);
              }}
            />
            {!isSidebarCollapsed && activeTab !== NavTab.MOCKUP && (`;

const newSidebarBlock = `            <Sidebar
              isCollapsed={isSidebarCollapsed}
              isAutoCollapsed={shouldAutoCollapse}
              onToggleCollapse={() => {
                wasManuallyCollapsedRef.current = !isSidebarCollapsed;
                setIsSidebarCollapsed(!isSidebarCollapsed);
              }}
              onExpand={() => {
                wasManuallyCollapsedRef.current = false;
                if (useStore.getState().activeTab === NavTab.MOCKUP) {
                  useStore.getState().setActiveTab(NavTab.TEMPLATES);
                }
                if (isRightPanelOpen && isCrushedScreen) {
                  setShowAIOverlay(false);
                }
                setIsSidebarCollapsed(false);
              }}
            />
            {!isSidebarCollapsed && !shouldAutoCollapse && (`;

content = content.replace(oldSidebarBlock, newSidebarBlock);

fs.writeFileSync(file, content);
console.log('Patched Editor.tsx with adaptive Sidebar Crush prevention');
