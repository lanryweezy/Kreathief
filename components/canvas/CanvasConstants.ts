export const GRID_SIZE = 10;
export const SNAP_THRESHOLD = 5;
export const MIN_LAYER_SIZE = 10;
export const ROTATION_SNAP_ANGLE = 15;
export const ROTATION_SNAP_SHIFT_ANGLE = 45;

export const ANIMATION_STYLES = `
  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slide { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes zoom { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes rotate { from { transform: rotate(-180deg); opacity: 0; } to { transform: rotate(0deg); opacity: 1; } }
  @keyframes bounce { 0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 40% {transform: translateY(-20px);} 60% {transform: translateY(-10px);} }
  @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
  @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
  @keyframes flip { from { transform: rotateY(90deg); opacity: 0; } to { transform: rotateY(0deg); opacity: 1; } }
  @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
`;
