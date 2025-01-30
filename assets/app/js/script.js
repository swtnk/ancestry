let familyMembers = [];
let editingMember = null;
const form = document.getElementById('add-member');
const myChart = echarts.init(document.getElementById('chart'));

// Generate a UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('familyMembers');
    if (savedData) {
        familyMembers = JSON.parse(savedData);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('familyMembers', JSON.stringify(familyMembers));
}

// Open modal for adding or editing a family member
function openModal(memberUUID = null) {
    editingMember = memberUUID;
    document.getElementById('modal-title').textContent = editingMember ? "Edit Family Member" : "Add Family Member";

    // Show/hide the delete button
    const deleteButton = document.getElementById('delete-button');
    deleteButton.style.display = editingMember ? 'inline-block' : 'none';

    // Pre-fill form data if editing
    if (editingMember) {
        const member = familyMembers.find(m => m.uuid === editingMember);
        if (member) {
            document.getElementById('name').value = member.name;
            document.getElementById('dob').value = member.dob || "";
            document.getElementById('gender').value = member.gender || "male";
            document.getElementById('spouse').value = member.spouse;
            document.getElementById('parent').value = member.parent;
        }
    } else {
        // Clear form for new member
        document.getElementById('name').value = "";
        document.getElementById('dob').value = "";
        document.getElementById('gender').value = "male";
        document.getElementById('spouse').value = [];
        document.getElementById('parent').value = [];
    }

    updateDropdowns();
    const modal = new bootstrap.Modal(document.getElementById('modal'));
    modal.show();
}

// Build family tree data for ECharts
function buildFamilyTree(members) {
    const memberMap = new Map();
    const roots = [];
    const parentColors = {}; // Store colors for each parent

    // Create a map of members
    members.forEach(member => {
        memberMap.set(member.uuid, { ...member, children: [] });
    });

    // Build the tree structure
    members.forEach(member => {
        if (member.parent && member.parent.length > 0) {
            member.parent.forEach(parentUUID => {
                const parent = memberMap.get(parentUUID);
                if (parent) {
                    parent.children.push(memberMap.get(member.uuid));
                }
            });
        } else {
            roots.push(memberMap.get(member.uuid));
        }
    });

    // Add spouse relationships
    members.forEach(member => {
        if (member.spouse && member.spouse.length > 0) {
            member.spouse.forEach(spouseUUID => {
                const spouse = memberMap.get(spouseUUID);
                if (spouse) {
                    // Add spouse as a child (for visualization purposes)
                    memberMap.get(member.uuid).children.push({
                        ...spouse,
                        relationship: 'spouse' // Mark as spouse
                    });
                }
            });
        }
    });

    // Assign colors to parents and their children
    members.forEach(member => {
        if (member.parent && member.parent.length > 0) {
            const parentUUID = member.parent[0]; // Use the first parent for color assignment
            if (!parentColors[parentUUID]) {
                parentColors[parentUUID] = getRandomColor(); // Assign a unique color to the parent
            }
            memberMap.get(member.uuid).color = parentColors[parentUUID]; // Assign the same color to the child
        }
    });

    return { roots, memberMap };
}

// Generate a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Update the family tree chart
function updateFamilyTree() {
    const graphType = document.getElementById('graph-type').value;

    if (graphType === 'tree') {
        const data = convertToTreeFormat(familyMembers); // Convert data to tree format
        // Tree structure
        const option = {
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove'
            },
            series: [
                {
                    type: 'tree',
                    data: [data],
                    top: '1%',
                    left: '7%',
                    bottom: '1%',
                    right: '20%',
                    symbolSize: 7,
                    label: {
                        position: 'left',
                        verticalAlign: 'middle',
                        align: 'right',
                        fontSize: 9
                    },
                    leaves: {
                        label: {
                            position: 'right',
                            verticalAlign: 'middle',
                            align: 'left'
                        }
                    },
                    emphasis: {
                        focus: 'descendant'
                    },
                    initialTreeDepth: 7,
                    expandAndCollapse: true,
                    animationDuration: 550,
                    animationDurationUpdate: 750
                }
            ]
        };
        myChart.setOption(option, true);
    } else if (graphType === 'tree-polyline') {
        const data = convertToTreeFormat(familyMembers); // Convert data to tree format
        // Tree structure
        const option = {
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove'
            },
            series: [
                {
                    type: 'tree',
                    id: 0,
                    data: [data],
                    top: '10%',
                    left: '8%',
                    bottom: '22%',
                    right: '20%',
                    symbolSize: 7,
                    edgeShape: 'polyline',
                    edgeForkPosition: '63%',
                    initialTreeDepth: 6,
                    lineStyle: {
                        width: 2
                    },
                    label: {
                        backgroundColor: '#fff',
                        position: 'left',
                        verticalAlign: 'middle',
                        align: 'right'
                    },
                    leaves: {
                        label: {
                            position: 'right',
                            verticalAlign: 'middle',
                            align: 'left'
                        }
                    },
                    emphasis: {
                        focus: 'descendant'
                    },
                    expandAndCollapse: true,
                    animationDuration: 550,
                    animationDurationUpdate: 750
                }
            ]
        };
        myChart.setOption(option, true);
    } else if (graphType === 'tree-radial') {
        const data = convertToTreeFormat(familyMembers); // Convert data to tree format
        // Tree structure
        const option =  {
            tooltip: {
              trigger: 'item',
              triggerOn: 'mousemove',
              tooltip: {
                    formatter: (params) => {
                        const data = params.data;
                        return `Name: ${data.name}<br>
                        ID: ${data.id || 'N/A'}<br>
                        DOB: ${data.dob || 'N/A'}`
                    }
                },
            },
            series: [
              {
                type: 'tree',
                data: [data],
                top: '18%',
                bottom: '14%',
                layout: 'radial',
                symbol: 'emptyCircle',
                symbolSize: 7,
                initialTreeDepth: 50,
                animationDurationUpdate: 750,
                emphasis: {
                  focus: 'descendant'
                }
              }
            ]
          };
        myChart.setOption(option, true);
    } else if (graphType === 'graph-force') {
        const { roots, memberMap } = buildFamilyTree(familyMembers);
        // Graph-Force
        const nodes = [];
        const links = [];

        memberMap.forEach((member, uuid) => {
            nodes.push({
                id: uuid, // Include UUID as the node ID
                name: member.name,
                gender: member.gender,
                parent: member.parent,
                dob: member.dob,
                spouse: member.spouse,
                value: `${member.name} (ID: ${member.id || 'N/A'})`,
                tooltip: {
                    formatter: (params) => {
                        const data = params.data;
                        return `Name: ${data.name}<br>
                        ID: ${data.id || 'N/A'}<br>
                        DOB: ${data.dob || 'N/A'}`
                    }
                },
                itemStyle: { color: member.color || 'gray' }
            });

            // Add spouse relationships
            member.spouse.forEach(spouseUUID => {
                links.push({ source: uuid, target: spouseUUID, lineStyle: { color: 'blue', type: 'dashed' } });
            });

            // Add parent-child relationships
            member.parent.forEach(parentUUID => {
                links.push({ source: parentUUID, target: uuid, lineStyle: { color: 'black', type: 'solid' } });
            });
        });

        const option = {
            tooltip: { trigger: 'item', triggerOn: 'mousemove' },
            series: [
                {
                    type: 'graph',
                    layout: 'force',
                    roam: true,
                    label: { show: true },
                    force: { repulsion: 300, gravity: 0.1, edgeLength: 100 },
                    data: nodes,
                    links: links,
                    edgeSymbol: ['circle', 'arrow'],
                    edgeSymbolSize: [4, 10],
                    itemStyle: (params) => {
                        // Color coding for nodes
                        if (params.data.relationship === 'spouse') {
                            return { color: 'orange' }; // Spouse color
                        } else {
                            return { color: params.data.color || 'gray' }; // Use assigned color or default to gray
                        }
                    }
                }
            ]
        };
        myChart.setOption(option, true);
    } else if (graphType === 'graph-label-overlap') {
        const { roots, memberMap } = buildFamilyTree(familyMembers);
        // Graph-Label-Overlap
        const nodes = [];
        const links = [];

        memberMap.forEach((member, uuid) => {
            nodes.push({
                id: uuid, // Include UUID as the node ID
                name: member.name,
                gender: member.gender,
                parent: member.parent,
                dob: member.dob,
                spouse: member.spouse,
                value: `${member.name} (ID: ${member.id || 'N/A'})`,
                tooltip: {
                    formatter: (params) => {
                        const data = params.data;
                        return `Name: ${data.name}<br>
                        ID: ${data.id || 'N/A'}<br>
                        DOB: ${data.dob || 'N/A'}`
                    }
                },
                itemStyle: { color: member.color || 'gray' }
            });

            // Add spouse relationships
            member.spouse.forEach(spouseUUID => {
                links.push({ source: uuid, target: spouseUUID, lineStyle: { color: 'blue', type: 'dashed' } });
            });

            // Add parent-child relationships
            member.parent.forEach(parentUUID => {
                links.push({ source: parentUUID, target: uuid, lineStyle: { color: 'black', type: 'solid' } });
            });
        });

        const option = {
            tooltip: { trigger: 'item', triggerOn: 'mousemove' },
            series: [
                {
                    type: 'graph',
                    layout: 'circular', // Use circular layout for label overlap
                    roam: true,
                    label: { show: true, position: 'right' },
                    circular: { rotateLabel: true }, // Rotate labels for better visibility
                    data: nodes,
                    links: links,
                    edgeSymbol: ['circle', 'arrow'],
                    edgeSymbolSize: [4, 10],
                    itemStyle: (params) => {
                        // Color coding for nodes
                        if (params.data.relationship === 'spouse') {
                            return { color: 'orange' }; // Spouse color
                        } else {
                            return { color: params.data.color || 'gray' }; // Use assigned color or default to gray
                        }
                    }
                }
            ]
        };
        myChart.setOption(option, true);
    }

    // Add click event listener to nodes
    myChart.on('click', function (params) {
        if (params.dataType === 'node') {
            const memberUUID = params.data.id; // Use the node's UUID
            openModal(memberUUID); // Open modal with the clicked node's data
        }
    });
}

// Update dropdowns for spouse and parent selection
function updateDropdowns() {
    const spouseSelect = document.getElementById('spouse');
    const parentSelect = document.getElementById('parent');
    spouseSelect.innerHTML = '';
    parentSelect.innerHTML = '';

    familyMembers.forEach(member => {
        let option = document.createElement('option');
        option.value = member.uuid;
        option.textContent = `${member.name} (${member.uuid})`; // Display name and UUID
        spouseSelect.appendChild(option.cloneNode(true));
        parentSelect.appendChild(option);
    });
}

// Save or update a family member
function saveMember() {
    const name = document.getElementById('name').value.trim();
    const dob = document.getElementById('dob').value.trim() || null;
    const gender = document.getElementById('gender').value;
    const spouses = Array.from(document.getElementById('spouse').selectedOptions).map(opt => opt.value);
    const parents = Array.from(document.getElementById('parent').selectedOptions).map(opt => opt.value);

    if (!name) {
        alert("Name is required!");
        return;
    }
    if (parents.length > 2) {
        alert("A person can have a maximum of 2 parents.");
        return;
    }

    if (editingMember) {
        // Update existing member
        let member = familyMembers.find(m => m.uuid === editingMember);
        if (member) {
            member.name = name;
            member.dob = dob;
            member.gender = gender;
            member.spouse = spouses;
            member.parent = parents;
        }
    } else {
        // Add new member
        familyMembers.push({ uuid: generateUUID(), name, dob, gender, spouse: spouses, parent: parents });
    }

    saveData(); // Save data to localStorage
    updateDropdowns();
    updateFamilyTree();
    const modal = bootstrap.Modal.getInstance(document.getElementById('modal'));
    modal.hide();
    form.reset();
}

// Delete a family member
function deleteMember() {
    if (editingMember) {
        // Remove the member from the familyMembers array
        familyMembers = familyMembers.filter(member => member.uuid !== editingMember);

        // Update localStorage and refresh the family tree
        saveData();
        updateDropdowns();
        updateFamilyTree();
        const modal = bootstrap.Modal.getInstance(document.getElementById('modal'));
        modal.hide();
        form.reset();
    }
}

// Clear localStorage (optional, for debugging)
function clearStorage() {
    localStorage.removeItem('familyMembers');
    familyMembers = [];
    updateFamilyTree();
    alert("LocalStorage cleared!");
    form.reset();
}

function JSONTOFile(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

function exportTree() {
    JSONTOFile(familyMembers, 'familyTree');
}

function importTree(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        familyMembers = JSON.parse(e.target.result);
        saveData();
        updateDropdowns();
        updateFamilyTree();
    };
    reader.readAsText(file);
}

// Initialize dropdowns, chart, and load data
loadData(); // Load data from localStorage
updateDropdowns();
updateFamilyTree();

const myModal = new bootstrap.Modal('#modal', {
    keyboard: false,
    backdrop: false
})
