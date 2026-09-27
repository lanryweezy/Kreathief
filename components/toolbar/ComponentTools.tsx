import React from 'react';
import { Icons } from '../../constants';
import { IconButton, Divider } from './ToolbarShared';
import { Layer } from '../../types';
import { useStore } from '../../store/useStore';

interface ComponentToolsProps {
  selectedLayer: Layer;
  handleUpdateLayer: (changes: any) => void;
}

export const ComponentTools = React.memo(({ selectedLayer, handleUpdateLayer }: ComponentToolsProps) => {
  const isComponent = selectedLayer.type === 'component_instance' || selectedLayer.type === 'component_master';

  return (
    <>
      <Divider />
      <IconButton
        icon={isComponent ? Icons.PackageOpen : Icons.Package}
        label={isComponent ? "Detach Instance" : "Create Component"}
        onClick={() => {
           if (isComponent) {
              handleUpdateLayer({ type: 'group' }); // Mock detaching
           } else {
              // Convert current selection into a master component
              handleUpdateLayer({ type: 'component_master', componentId: 'comp_' + Date.now() });
              console.log('Component Created!');
           }
        }}
        className={isComponent ? "text-fuchsia-400" : "text-brand-400"}
      />
    </>
  );
});
