import React from 'react'
import { RightOutlined } from '@ant-design/icons'
import type { MethodologyType, Stage } from '../types'
import { WATERFALL_STAGES, AGILE_STAGES } from '../types'

interface WorkflowDiagramProps {
  methodology: MethodologyType
  stages: Stage[]
  activeStageIndex?: number
  onStageClick?: (index: number) => void
}

const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({
  methodology,
  stages,
  activeStageIndex = -1,
  onStageClick,
}) => {
  const templateStages = methodology === 'waterfall' ? WATERFALL_STAGES : AGILE_STAGES

  const getStageStatus = (index: number) => {
    const templateStage = templateStages[index]
    const existingStage = stages.find(s => s.stage_type === templateStage.type)

    if (!existingStage) return 'empty'
    if (index === activeStageIndex) return 'active'
    if (existingStage.allocations && existingStage.allocations.length > 0) return 'completed'
    return 'configured'
  }

  return (
    <div className="workflow-container">
      {templateStages.map((stage, index) => (
        <React.Fragment key={stage.type}>
          <div
            className={`workflow-stage ${getStageStatus(index)}`}
            onClick={() => onStageClick?.(index)}
          >
            <div className="workflow-stage-box">
              {stage.name}
            </div>
            {stage.subStages && (
              <div className="sub-stages">
                {stage.subStages.map((subStageName, subIndex) => (
                  <div
                    key={subIndex}
                    className="sub-stage-item"
                  >
                    <div className={`sub-stage-dot ${subIndex === 0 ? 'active' : ''}`} />
                    <div className="sub-stage-label">{subStageName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {index < templateStages.length - 1 && (
            <RightOutlined className="workflow-arrow" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default WorkflowDiagram
