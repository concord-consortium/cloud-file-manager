import React from 'react'
import { ProviderInterface } from '../providers/provider-interface'

interface SelectProviderDialogTabProps {
  provider: ProviderInterface
}

const SelectProviderDialogTab: React.FC<SelectProviderDialogTabProps> = ({ provider }) => {
  return <div>TODO: SelectProviderDialogTab: {provider.displayName}</div>
}

export default SelectProviderDialogTab
