function getAllCombinations() {
  const combos = [];

  const structure = {
    Educatif: {
      Primaire: ['SIL', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
      Secondaire: ['6e', '5e', '4e', '3e', '2nde', '1ère', 'Terminale'],
      Universitaire: {
        'Licence 1': ['Mathématiques', 'Physique'],
        'Licence 2': ['Mathématiques', 'Physique'],
      },
    },
    Professionnel: {
      'Filières': ['Informatique', 'Pisciculture', 'Agriculture'],
    },
  };

  // Domaine éducatif
  for (const [niveauCat, niveaux] of Object.entries(structure.Educatif)) {
    if (niveauCat === 'Universitaire') {
      for (const [niveau, matieres] of Object.entries(niveaux)) {
        matieres.forEach((m) => {
          combos.push({ domaine: 'Educatif', niveau, matiere: m });
        });
      }
    } else {
      niveaux.forEach((n) => {
        ['Mathématiques', 'Français', 'Histoire', 'Culture et spiritualité'].forEach((m) => {
          combos.push({ domaine: 'Educatif', niveau: n, matiere: m });
        });
      });
    }
  }

  // Domaine professionnel
  structure.Professionnel.Filières.forEach((filiere) => {
    combos.push({ domaine: 'Professionnel', niveau: filiere, matiere: filiere });
  });

  return combos;
}

module.exports = { getAllCombinations };
