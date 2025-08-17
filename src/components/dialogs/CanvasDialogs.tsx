import { default as FoldDialog } from './FoldDialog';
import { default as EditSegmentDialog } from './EditSegmentDialog';
import { default as EditAngleDialog } from './EditAngleDialog';
import { default as EndpointDialog } from './EndpointDialog';
import { default as AddSegmentDialog } from './AddSegmentDialog';
import { useDialogStore } from '../../store/dialogStore';

const CanvasDialogs: React.FC = () => {
  const dialog = useDialogStore();
  if (!dialog.open || !dialog.anchor) return null;

  switch (dialog.type) {
    case 'addSegment': {
      if (
        dialog.type === 'addSegment' &&
        'end' in dialog &&
        'lineIdx' in dialog
      ) {
        return (
          <AddSegmentDialog
            open={dialog.open}
            anchor={dialog.anchor}
            end={dialog.end as 'start' | 'end'}
            lineIdx={dialog.lineIdx as number}
          />
        );
      }
      return null;
    }
    case 'endpoint':
      return <EndpointDialog open={dialog.open} anchor={dialog.anchor} />;
    case 'fold': {
      if (
        dialog.type === 'fold' &&
        'end' in dialog &&
        'lineIdx' in dialog
      ) {
        return (
          <FoldDialog
            open={dialog.open}
            end={dialog.end as 'start' | 'end' | null}
            lineIdx={dialog.lineIdx as number}
            onClose={dialog.closeDialog}
            onOk={() => {}}
          />
        );
      }
      return null;
    }
    case 'editSegment': {
      if (
        dialog.type === 'editSegment' &&
        'anchor' in dialog &&
        'length' in dialog &&
        'segIdx' in dialog &&
        'lineIdx' in dialog
      ) {
        return (
          <EditSegmentDialog
            open={dialog.open}
            anchor={dialog.anchor as { x: number; y: number }}
            length={dialog.length as string}
            segIdx={dialog.segIdx as number}
            lineIdx={dialog.lineIdx as number}
          />
        );
      }
      return null;
    }
    case 'editAngle': {
      if (
        dialog.type === 'editAngle' &&
        'anchor' in dialog &&
        'angle' in dialog &&
        'segIdx' in dialog &&
        'lineIdx' in dialog
      ) {
        return (
          <EditAngleDialog
            open={dialog.open}
            anchor={dialog.anchor as { x: number; y: number }}
            angle={dialog.angle as string}
            segIdx={dialog.segIdx as number}
            lineIdx={dialog.lineIdx as number}
          />
        );
      }
      return null;
    }
    default:
      return null;
  }
};

export default CanvasDialogs;
