const RESOURCE_SPACE = "space";
var roleCollector = require('role.collector');

var roleBuilder = require('role.builder');

module.exports = {
    // state working = Returning energy to structure
    run: function(creep) {

        if (creep.getRidOfMinerals() == false) {
            if (_.sum(creep.carry) == 0) {
                // switch state to collecting
                if (creep.memory.working == true) {
                    delete creep.memory._move;
                }
                creep.memory.working = false;
            }
            else if (_.sum(creep.carry) == creep.carryCapacity) {
                // creep is collecting energy but is full
                if (creep.memory.working == false) {
                    delete creep.memory._move;
                }
                creep.memory.working = true;
            }

            if (creep.memory.working == true) {
                // creep is supposed to transfer energy to a structure
                // Find construction sites
                var constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
                if (constructionSites.length > 0 && creep.room.name != creep.memory.homeroom) {
                    // Construction sites found, build them!
                    roleBuilder.run(creep);
                }
                else {
                    var road = creep.pos.lookFor(LOOK_STRUCTURES);
                    if (creep.room.controller != undefined && (creep.room.controller.owner == undefined || creep.room.controller.owner.username != Game.getObjectById(creep.memory.spawn).room.controller.owner.username ) && road[0] != undefined && road[0].hits < road[0].hitsMax && road[0].structureType == STRUCTURE_ROAD && creep.room.name != creep.memory.homeroom) {
                        // Found road to repair
                        creep.repair(road[0]);
                    }
                    else {
                        // Find exit to spawn room
                        var spawn = Game.getObjectById(creep.memory.spawn);
                        if (creep.room.name != creep.memory.homeroom) {
                            creep.moveTo(spawn, {reusePath: 5})
                        }
                        else {
                            // back in spawn room
                            // find closest spawn, extension, tower or container which is not full
                            var structure = creep.findResource(RESOURCE_SPACE, STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_LINK, STRUCTURE_CONTAINER, STRUCTURE_STORAGE, STRUCTURE_EXTENSION);

                            // if we found one
                            if (structure != null) {
                                // try to transfer energy, if it is not in range
                                if (creep.transfer(structure, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                    // move towards it
                                    creep.moveTo(structure, {reusePath: 5, ignoreCreeps: false});
                                }
                            }
                            else {
                                creep.say("No Structure!");
                            }
                        }
                    }
                }
            }
            // if creep is supposed to harvest energy from source
            else {
                //Find remote source
                var remoteSource = Game.flags[creep.findMyFlag("haulEnergy")];
                if (remoteSource != -1 && remoteSource != undefined) {

                    // Find exit to target room
                    if (creep.room.name != remoteSource.pos.roomName) {
                        //still in old room, go out
                        creep.moveTo(remoteSource, {reusePath: 10});
                    }
                    else {
                        //new room reached, start collecting
                        if (creep.room.memory.hostiles == 0) {
                            //No enemy creeps
                            var container = creep.findResource(RESOURCE_ENERGY, STRUCTURE_CONTAINER);
                            if (container != null) {
                                if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(container, {reusePath: 10});
                                }
                            }
                            else {
                                //creep.moveTo(remoteSource, {reusePath: 10});
                                roleCollector.run(creep);
                            }
                        }
                        else {
                            //Hostiles creeps in new room
                            var homespawn = Game.getObjectById(creep.memory.spawn);
                            if (creep.room.name != creep.memory.homeroom) {
                                creep.moveTo(homespawn), {reusePath: 10};
                            }
                            else if (creep.pos.getRangeTo(homespawn) > 5) {
                                creep.moveTo(homespawn), {reusePath: 10};
                            }
                        }
                    }
                }
            }
        }
    }
};