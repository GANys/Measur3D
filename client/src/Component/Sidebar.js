import React from "react";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Divider from "@material-ui/core/Divider";

class Sidebar extends React.Component {
  render() {
    const { items, depthStep, depth } = this.props;

    return (
        <List disablePadding>
          {items.map((sidebarItem, index) => (
            <React.Fragment key={`${sidebarItem.name}${index}`}>
              {sidebarItem === "divider" ? (
                <Divider style={{ margin: "6px 0" }} />
              ) : (
                <ListItem
                  key={index}
                  className="sidebar-item"
                  button
                  onClick={() =>
                    this.props.showModal(
                      sidebarItem.label,
                      sidebarItem.content
                    )
                  }
                  {...this.rest}
                >
                  <div
                    style={{ paddingLeft: depth * depthStep }}
                    className="sidebar-item-content"
                  >
                    {sidebarItem.Icon && (
                      <sidebarItem.Icon
                        className="sidebar-item-icon"
                        fontSize="small"
                      />
                    )}
                    <div className="sidebar-item-text">{sidebarItem.label}</div>
                  </div>
                </ListItem>
              )}
            </React.Fragment>
          ))}
        </List>
    );
  }
}

export default Sidebar;
