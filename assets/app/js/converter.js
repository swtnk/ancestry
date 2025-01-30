function convertToTreeFormat(familyData) {
    const lookup = new Map();
    
    // Create lookup table
    familyData.forEach(person => {
        lookup.set(person.uuid, { uuid: person.uuid, name: person.name, children: [], spouse: false });
    });

    let rootNodes = [];
    
    // Build tree structure
    familyData.forEach(person => {
        if (person.parent.length === 0 && person.spouse.length === 0) {
            rootNodes.push(lookup.get(person.uuid));
        }

        person.parent.forEach(parentId => {
            if (lookup.has(parentId)) {
                lookup.get(parentId).children.push(lookup.get(person.uuid));
            }
        });
    });

    // Handle spouse relationships by nesting them under their spouse as a child
    familyData.forEach(person => {
        person.spouse.forEach(spouseId => {
            if (lookup.has(spouseId)) {
                let spouseNode = lookup.get(spouseId);
                let personNode = lookup.get(person.uuid);
                personNode.spouse = true;
                spouseNode.children.push(personNode);
            }
        });
    });
    
    return { name: "Root", children: rootNodes };
}
