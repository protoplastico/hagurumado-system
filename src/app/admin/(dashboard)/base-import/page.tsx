import { ImportWizard } from './_components/import-wizard'

export default function BaseImportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">BASEインポート</h1>
      <ImportWizard />
    </div>
  )
}
