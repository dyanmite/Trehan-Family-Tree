import { Handle, Position } from '@xyflow/react';
import { User } from 'lucide-react';
import Image from 'next/image';

interface FamilyNodeProps {
  data: {
    label: string;
    photoUrl?: string;
    relation?: string;
    deathDate?: string;
    isSpouse?: boolean;
    onClick?: () => void;
  };
}

export function FamilyNode({ data }: FamilyNodeProps) {
  const isDeceased = !!data.deathDate;

  return (
    <div 
      onClick={data.onClick}
      className={`bg-card px-4 py-3 rounded-2xl shadow-sm border min-w-[200px] flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow ${isDeceased ? 'border-muted-foreground/40 opacity-80' : 'border-border'}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2 border-none" />
      
      <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border-2 ${isDeceased ? 'bg-muted border-muted-foreground/30 grayscale' : 'bg-primary/10 border-primary/20'}`}>
        {data.photoUrl ? (
          <Image src={data.photoUrl} alt={data.label} width={48} height={48} className="object-cover w-full h-full" />
        ) : (
          <User className={`w-6 h-6 ${isDeceased ? 'text-muted-foreground' : 'text-primary'}`} />
        )}
      </div>
      
      <div className="flex flex-col">
        <span className="font-heading font-medium text-foreground">{data.label}</span>
        <div className="flex items-center gap-1.5">
          {data.relation && (
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{data.relation}</span>
          )}
          {isDeceased && (
            <span className="text-[10px] bg-muted-foreground/10 text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
              🕊️
            </span>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2 border-none" />
    </div>
  );
}
