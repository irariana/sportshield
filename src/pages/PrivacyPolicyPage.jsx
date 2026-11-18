import React from 'react'
import { PageHeader } from '../components/ui'

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <PageHeader
        title="Politique de Confidentialité et Traitement des Données"
        description="Conformité RGPD et principes éthiques de SportShield pour la protection des athlètes."
      />

      <div className="space-y-6 rounded-md border border-[#E2E0D8] bg-white p-8 text-sm text-[#14161A]">
        <section className="space-y-2">
          <h2 className="text-lg font-bold font-['Barlow_Condensed'] text-[#0E2A47]">1. Finalités et Principes Fondamentaux</h2>
          <p className="text-[#5B606B]">
            SportShield est un outil de suivi de la forme et de la santé des athlètes au sein de leur fédération sportive. Toutes les données collectées (fréquence cardiaque, sommeil, GPS, suivi médical) ont pour unique finalité l’optimisation de l’entraînement et la préservation de la santé des sportifs.
          </p>
          <p className="text-[#5B606B] font-semibold">
            Règle absolue : Aucune donnée de SportShield ne peut être utilisée à des fins de négociation de contrat, de sélection/éviction injustifiée, ni transmise à des tiers (presse, sponsors).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-['Barlow_Condensed'] text-[#0E2A47]">2. Matrice des Accès par Rôle</h2>
          <ul className="list-disc pl-5 space-y-1 text-[#5B606B]">
            <li><strong>Administrateur</strong> : Gestion globale, capteurs, créneaux GPS, supervision générale. Pas d’accès au dossier médical détaillé ni aux mesures de santé brutes.</li>
            <li><strong>Médecin</strong> : Seul habilité à consulter et renseigner le dossier médical et l’aptitude.</li>
            <li><strong>Entraîneur</strong> : Accès aux indicateurs de forme globale et charges, sans voir le détail médical ni la FC brute.</li>
            <li><strong>Sportif</strong> : Propriétaire exclusif de ses données. Accès total à son espace, droit de retrait d’accord et portabilité CSV.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold font-['Barlow_Condensed'] text-[#0E2A47]">3. Transparence de l’IA (AI Act)</h2>
          <p className="text-[#5B606B]">
            Les indicateurs de forme et de préparation sont calculés à partir de règles simples, traçables et explicables (par ex. comparaison de la FC de repos et du sommeil sur des moyennes mobiles). Aucune décision automatisée n’est prise sans intervention humaine.
          </p>
        </section>
      </div>
    </div>
  )
}
