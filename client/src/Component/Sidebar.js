import React from "react";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Divider from "@material-ui/core/Divider";

class Sidebar extends React.Component {
  render() {
    const { items } = this.props;

    return (
      <List disablePadding>
        {items.map((sidebarItem, index) => (
          <React.Fragment key={`${sidebarItem.name}${index}`}>
            {sidebarItem === "divider" ? (
              <Divider className="divider" />
            ) : (
              <ListItem
                key={index}
                className="sidebar-item"
                button
                onClick={() =>
                  this.props.showModal(sidebarItem.label, sidebarItem.content)
                }
                {...this.rest}
              >
                <sidebarItem.Icon
                  className="sidebar-item-icon"
                  fontSize="small"
                />
                <div className="sidebar-item-text">{sidebarItem.label}</div>
              </ListItem>
            )}
          </React.Fragment>
        ))}
      </List>
    );
  }
}

export default Sidebar;
